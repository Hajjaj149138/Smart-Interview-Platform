package com.project.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.interview.dto.InterviewDtos.*;
import com.project.interview.model.InterviewSession;
import com.project.interview.model.User;
import com.project.interview.repository.InterviewSessionRepository;
import com.project.interview.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@org.springframework.transaction.annotation.Transactional
public class InterviewService {

    @Value("${GROQ_API_KEY}")
    private String groqApiKey;

    private final InterviewSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public InterviewService(InterviewSessionRepository sessionRepository,
                            UserRepository userRepository,
                            ObjectMapper objectMapper) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    private String callGroq(String systemPrompt, String userPrompt) {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "llama-3.3-70b-versatile");
        body.put("temperature", 0.7);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        body.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            return root.get("choices").get(0).get("message").get("content").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Groq response");
        }
    }

    public QuestionResponse generateQuestion(String jobRole, String difficulty, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String systemPrompt = """
                You are a Senior Technical Interviewer. Generate ONE technical interview question.
                Respond ONLY with this JSON format, no extra text, no markdown:
                {
                  "question": "Your question here",
                  "difficultyLevel": "Easy|Medium|Hard"
                }
                """;

        String userPrompt = String.format(
                "Generate a %s difficulty question for a %s developer position.",
                difficulty != null ? difficulty : "Medium", jobRole);

        String aiResponse = callGroq(systemPrompt, userPrompt);

        try {
            JsonNode json = objectMapper.readTree(cleanJson(aiResponse));
            String question = json.get("question").asText();
            String difficultyLevel = json.get("difficultyLevel").asText();
            String sessionId = UUID.randomUUID().toString();

            InterviewSession session = InterviewSession.builder()
                    .sessionId(sessionId).user(user).jobRole(jobRole)
                    .question(question).difficultyLevel(difficultyLevel)
                    .build();
            sessionRepository.save(session);

            return QuestionResponse.builder()
                    .sessionId(sessionId).question(question)
                    .difficultyLevel(difficultyLevel).jobRole(jobRole)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate question: " + e.getMessage());
        }
    }

    public EvaluationResponse evaluateAnswer(EvaluationRequest request, String username) {
        InterviewSession session = sessionRepository.findBySessionId(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getUsername().equals(username))
            throw new RuntimeException("Unauthorized");

        String systemPrompt = """
                You are a Senior Technical Interviewer evaluating a candidate's answer.
                Respond ONLY with this JSON format, no extra text, no markdown:
                {
                  "score": 7,
                  "technicalAccuracy": 7,
                  "communicationClarity": 7,
                  "feedback": "detailed feedback here",
                  "strengths": "what was good",
                  "improvements": "what to improve"
                }
                """;

        String userPrompt = String.format(
                "Job Role: %s\nQuestion: %s\nAnswer: %s\nEvaluate this answer.",
                session.getJobRole(), session.getQuestion(), request.getAnswer());

        String aiResponse = callGroq(systemPrompt, userPrompt);

        try {
            JsonNode json = objectMapper.readTree(cleanJson(aiResponse));
            int score = json.get("score").asInt();
            int technical = json.get("technicalAccuracy").asInt();
            int clarity = json.get("communicationClarity").asInt();
            String feedback = json.get("feedback").asText();
            String strengths = json.get("strengths").asText();
            String improvements = json.get("improvements").asText();

            session.setAnswer(request.getAnswer());
            session.setScore(score);
            session.setTechnicalAccuracy(technical);
            session.setCommunicationClarity(clarity);
            session.setFeedback(feedback);
            session.setCompletedAt(LocalDateTime.now());
            sessionRepository.save(session);

            return EvaluationResponse.builder()
                    .sessionId(request.getSessionId()).score(score)
                    .technicalAccuracy(technical).communicationClarity(clarity)
                    .feedback(feedback).strengths(strengths).improvements(improvements)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to evaluate: " + e.getMessage());
        }
    }

    public DashboardStats getDashboardStats(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<InterviewSession> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        long completed = sessions.stream().filter(s -> s.getScore() != null).count();
        Double avgScore = sessionRepository.findAverageScoreByUserId(user.getId());

        List<SessionHistoryResponse> history = sessions.stream()
                .map(this::mapToHistory).collect(Collectors.toList());

        return DashboardStats.builder()
                .totalSessions((long) sessions.size())
                .completedSessions(completed)
                .averageScore(avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0)
                .recentSessions(history).build();
    }

    private SessionHistoryResponse mapToHistory(InterviewSession s) {
        return SessionHistoryResponse.builder()
                .id(s.getId()).sessionId(s.getSessionId()).jobRole(s.getJobRole())
                .question(s.getQuestion()).difficultyLevel(s.getDifficultyLevel())
                .score(s.getScore()).technicalAccuracy(s.getTechnicalAccuracy())
                .communicationClarity(s.getCommunicationClarity())
                .feedback(s.getFeedback()).createdAt(s.getCreatedAt())
                .completedAt(s.getCompletedAt()).build();
    }

    private String cleanJson(String response) {
        if (response == null) return "{}";
        response = response.trim();
        if (response.startsWith("```json")) response = response.substring(7);
        else if (response.startsWith("```")) response = response.substring(3);
        if (response.endsWith("```")) response = response.substring(0, response.length() - 3);
        return response.trim();
    }
}