package com.project.interview.controller;

import com.project.interview.dto.InterviewDtos.*;
import com.project.interview.service.InterviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/question")
    public ResponseEntity<QuestionResponse> generateQuestion(
            @Valid @RequestBody QuestionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                interviewService.generateQuestion(request.getJobRole(), request.getDifficulty(), userDetails.getUsername())
        );
    }

    @PostMapping("/evaluate")
    public ResponseEntity<EvaluationResponse> evaluateAnswer(
            @Valid @RequestBody EvaluationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                interviewService.evaluateAnswer(request, userDetails.getUsername())
        );
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStats> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                interviewService.getDashboardStats(userDetails.getUsername())
        );
    }
}
