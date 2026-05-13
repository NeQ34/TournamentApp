package Lab_spec.tournament_backend.controller;

import Lab_spec.tournament_backend.dto.TournamentRequest;
import Lab_spec.tournament_backend.dto.TournamentResponse;
import Lab_spec.tournament_backend.model.Team;
import Lab_spec.tournament_backend.repository.TeamRepository;
import Lab_spec.tournament_backend.service.TournamentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/tournaments")
@CrossOrigin(origins = "http://localhost:5173")
public class TournamentController {

    private final TournamentService tournamentService;
    private final TeamRepository teamRepository;

    public TournamentController(TournamentService tournamentService, TeamRepository teamRepository) {
        this.tournamentService = tournamentService;
        this.teamRepository = teamRepository;
    }

    // Pobierz wszystkie turnieje
    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getAllTournaments() {
        return ResponseEntity.ok(tournamentService.getAllTournaments());
    }

    // Pobierz turniej po ID
    @GetMapping("/{id}")
    public ResponseEntity<TournamentResponse> getTournamentById(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.getTournamentById(id));
    }

    // Utwórz turniej
    @PostMapping
    public ResponseEntity<TournamentResponse> createTournament(@Valid @RequestBody TournamentRequest request) {
        TournamentResponse response = tournamentService.createTournament(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Edytuj turniej
    @PutMapping("/{id}")
    public ResponseEntity<TournamentResponse> updateTournament(@PathVariable Long id,
                                                               @Valid @RequestBody TournamentRequest request) {
        TournamentResponse response = tournamentService.updateTournament(id, request);
        return ResponseEntity.ok(response);
    }

    // Usuń turniej
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        tournamentService.deleteTournament(id);
        return ResponseEntity.noContent().build();
    }

    // Pobierz dostępne drużyny (niezgłoszone, w odpowiedniej dyscyplinie)
    @GetMapping("/{id}/available-teams")
    public ResponseEntity<List<Team>> getAvailableTeams(@PathVariable Long id,
                                                        @RequestParam String discipline) {
        return ResponseEntity.ok(tournamentService.getAvailableTeams(id, discipline));
    }

    // Pobierz zgłoszone drużyny
    @GetMapping("/{id}/teams")
    public ResponseEntity<?> getRegisteredTeams(@PathVariable Long id) {
        try {
            List<Team> teams = tournamentService.getRegisteredTeams(id);

            // Ręczna konwersja żeby uniknąć cykli
            List<Map<String, Object>> response = teams.stream().map(team -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", team.getId());
                map.put("name", team.getName());
                map.put("sport", team.getSport());
                map.put("captainName", team.getCaptain().getFirstName() + " " + team.getCaptain().getLastName());
                map.put("membersCount", team.getMembers().size());
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Dodaj drużynę do turnieju
    @PostMapping("/{tournamentId}/teams/{teamId}")
    public ResponseEntity<Void> addTeamToTournament(@PathVariable Long tournamentId,
                                                    @PathVariable Long teamId) {
        tournamentService.addTeamToTournament(tournamentId, teamId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // Usuń drużynę z turnieju
    @DeleteMapping("/{tournamentId}/teams/{teamId}")
    public ResponseEntity<Void> removeTeamFromTournament(@PathVariable Long tournamentId,
                                                         @PathVariable Long teamId) {
        tournamentService.removeTeamFromTournament(tournamentId, teamId);
        return ResponseEntity.noContent().build();
    }
}