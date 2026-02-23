package com.project.interview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class InterviewDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionRequest {
        @NotBlank
        private String jobRole;

        private String difficulty; // easy, medium, hard
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResponse {
        private String sessionId;
        private String question;
        private String difficultyLevel;
        private String jobRole;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationRequest {
        @NotBlank
        private String sessionId;

        @NotBlank
        private String answer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationResponse {
        private String sessionId;
        private Integer score;
        private Integer technicalAccuracy;
        private Integer communicationClarity;
        private String feedback;
        private String strengths;
        private String improvements;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionHistoryResponse {
        private Long id;
        private String sessionId;
        private String jobRole;
        private String question;
        private String difficultyLevel;
        private Integer score;
        private Integer technicalAccuracy;
        private Integer communicationClarity;
        private String feedback;
        private LocalDateTime createdAt;
        private LocalDateTime completedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private Long totalSessions;
        private Long completedSessions;
        private Double averageScore;
        private java.util.List<SessionHistoryResponse> recentSessions;
    }
}
