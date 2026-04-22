package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.TeamMember;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);

    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.user.id = :userId")
    void deleteByTeamIdAndUserId(@Param("teamId") Long teamId, @Param("userId") Long userId);

    boolean existsByTeamIdAndUserId(Long teamId, Long userId);
}
