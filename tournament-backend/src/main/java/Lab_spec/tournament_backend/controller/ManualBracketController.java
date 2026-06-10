package Lab_spec.tournament_backend.controller;

import Lab_spec.tournament_backend.model.Match;
import Lab_spec.tournament_backend.model.Team;
import Lab_spec.tournament_backend.service.ManualBracketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tournaments/{tournamentId}/manual")
@CrossOrigin(origins = "http://localhost:5173")
public class ManualBracketController {

    private final ManualBracketService manualBracketService;

    public ManualBracketController(ManualBracketService manualBracketService) {
        this.manualBracketService = manualBracketService;
    }

    // Ustaw tryb ręczny dla turnieju
    @PostMapping("/enable")
    public ResponseEntity<?> enableManualMode(@PathVariable Long tournamentId) {
        try {
            manualBracketService.enableManualMode(tournamentId);
            return ResponseEntity.ok(Map.of("message", "Tryb ręczny włączony"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Pobierz dostępne drużyny (nieprzypisane do żadnego meczu)
    @GetMapping("/available-teams")
    public ResponseEntity<List<Team>> getAvailableTeams(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(manualBracketService.getAvailableTeams(tournamentId));
    }

    // Pobierz wszystkie mecze w turnieju
    @GetMapping("/matches")
    public ResponseEntity<List<Match>> getAllMatches(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(manualBracketService.getAllMatches(tournamentId));
    }

    // Pobierz mecze pogrupowane po rundach
    @GetMapping("/matches/by-round")
    public ResponseEntity<Map<Integer, List<Match>>> getMatchesByRound(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(manualBracketService.getMatchesByRound(tournamentId));
    }

    // Utwórz nowy mecz
    @PostMapping("/matches")
    public ResponseEntity<?> createMatch(
            @PathVariable Long tournamentId,
            @RequestBody Map<String, Object> body) {
        try {
            Long teamAId = body.containsKey("teamAId") && body.get("teamAId") != null
                    ? Long.valueOf(body.get("teamAId").toString())
                    : null;
            Long teamBId = body.containsKey("teamBId") && body.get("teamBId") != null
                    ? Long.valueOf(body.get("teamBId").toString())
                    : null;
            Integer roundNumber = body.containsKey("roundNumber")
                    ? Integer.valueOf(body.get("roundNumber").toString())
                    : 1;

            Match match = manualBracketService.createMatch(
                    tournamentId, teamAId, teamBId, roundNumber, null, null
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Zaktualizuj mecz
    @PutMapping("/matches/{matchId}")
    public ResponseEntity<?> updateMatch(
            @PathVariable Long tournamentId,
            @PathVariable Long matchId,
            @RequestBody Map<String, Object> body) {
        try {
            Long teamAId = body.containsKey("teamAId") ?
                    Long.valueOf(body.get("teamAId").toString()) : null;
            Long teamBId = body.containsKey("teamBId") ?
                    Long.valueOf(body.get("teamBId").toString()) : null;
            String result = (String) body.get("result");
            Long winnerId = body.containsKey("winnerId") ?
                    Long.valueOf(body.get("winnerId").toString()) : null;
            LocalDateTime scheduledTime = body.containsKey("scheduledTime") && body.get("scheduledTime") != null ?
                    LocalDateTime.parse(body.get("scheduledTime").toString()) : null;
            Integer courtNumber = body.containsKey("courtNumber") && body.get("courtNumber") != null ?
                    Integer.valueOf(body.get("courtNumber").toString()) : null;
            Integer roundNumber = body.containsKey("roundNumber") ?
                    Integer.valueOf(body.get("roundNumber").toString()) : null;
            String notes = (String) body.get("notes");

            Match match = manualBracketService.updateMatch(
                    matchId, teamAId, teamBId, result, winnerId,
                    scheduledTime, courtNumber, roundNumber, notes
            );
            return ResponseEntity.ok(match);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Usuń mecz
    @DeleteMapping("/matches/{matchId}")
    public ResponseEntity<?> deleteMatch(
            @PathVariable Long tournamentId,
            @PathVariable Long matchId) {
        try {
            manualBracketService.deleteMatch(matchId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Pobierz zwycięzców danej rundy (do następnej rundy)
    @GetMapping("/winners/{roundNumber}")
    public ResponseEntity<List<Team>> getWinnersFromRound(
            @PathVariable Long tournamentId,
            @PathVariable Integer roundNumber) {
        return ResponseEntity.ok(manualBracketService.getWinnersFromRound(tournamentId, roundNumber));
    }
}