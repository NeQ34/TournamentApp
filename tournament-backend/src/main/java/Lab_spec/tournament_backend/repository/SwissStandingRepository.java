package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.SwissStanding;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SwissStandingRepository extends JpaRepository<SwissStanding, Long> {
    List<SwissStanding> findByTournamentIdOrderByPointsDescWinsDesc(Long tournamentId);
    Optional<SwissStanding> findByTournamentIdAndTeamId(Long tournamentId, Long teamId);

    @Modifying
    @Transactional
    @Query("DELETE FROM SwissStanding s WHERE s.tournament.id = :tournamentId")
    void deleteByTournamentId(@Param("tournamentId") Long tournamentId);
}
