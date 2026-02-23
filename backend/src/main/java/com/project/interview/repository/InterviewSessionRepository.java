package com.project.interview.repository;

import com.project.interview.model.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<InterviewSession> findBySessionId(String sessionId);

    @Query("SELECT AVG(s.score) FROM InterviewSession s WHERE s.user.id = :userId AND s.score IS NOT NULL")
    Double findAverageScoreByUserId(Long userId);

    @Query("SELECT COUNT(s) FROM InterviewSession s WHERE s.user.id = :userId AND s.score IS NOT NULL")
    Long countCompletedByUserId(Long userId);
}
