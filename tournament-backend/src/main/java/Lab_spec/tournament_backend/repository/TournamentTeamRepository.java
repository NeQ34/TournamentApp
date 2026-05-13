package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.Tournament;
import Lab_spec.tournament_backend.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface TournamentTeamRepository extends JpaRepository<Tournament, Long> {

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM tournament_teams WHERE tournament_id = :tournamentId AND team_id = :teamId", nativeQuery = true)
    void removeTeamFromTournament(@Param("tournamentId") Long tournamentId, @Param("teamId") Long teamId);

    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM Tournament t JOIN t.teams team WHERE t.id = :tournamentId AND team.id = :teamId")
    boolean isTeamRegistered(@Param("tournamentId") Long tournamentId, @Param("teamId") Long teamId);
}