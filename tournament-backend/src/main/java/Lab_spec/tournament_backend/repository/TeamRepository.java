package Lab_spec.tournament_backend.repository;

import Lab_spec.tournament_backend.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByName(String name);
    List<Team> findByStatus(String status);

    @Query("SELECT t FROM Team t LEFT JOIN FETCH t.members WHERE t.id = :id")
    Optional<Team> findByIdWithMembers(@Param("id") Long id);

    boolean existsByName(String name);

    boolean existsBySportIgnoreCase(String sport);
    List<Team> findByStatusAndSport(String status, String sport);

    @Query(value = "SELECT t.* FROM teams t " +
            "JOIN tournament_teams tt ON t.id = tt.team_id " +
            "WHERE tt.tournament_id = :tournamentId", nativeQuery = true)
    List<Team> findByTournamentId(@Param("tournamentId") Long tournamentId);
}
