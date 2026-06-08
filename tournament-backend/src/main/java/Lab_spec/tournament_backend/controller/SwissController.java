package Lab_spec.tournament_backend.controller;

import Lab_spec.tournament_backend.model.SwissRound;
import Lab_spec.tournament_backend.service.SwissService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/tournaments/{tournamentId}/swiss")
@CrossOrigin(origins = "http://localhost:5173")
public class SwissController {

    private final SwissService swissService;

    public SwissController(SwissService swissService) {
        this.swissService = swissService;
    }

    @PostMapping("/initialize")
    public ResponseEntity<?> initialize(@PathVariable Long tournamentId,
                                        @RequestParam int numberOfRounds,
                                        @RequestParam int startHour) {
        try {
            swissService.initializeSwiss(tournamentId, numberOfRounds, startHour);
            return ResponseEntity.ok(Map.of("message", "System szwajcarski zainicjalizowany"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/standings")
    public ResponseEntity<?> getStandings(@PathVariable Long tournamentId) {
        return ResponseEntity.ok(swissService.getStandings(tournamentId));
    }

    @GetMapping("/pairings/{roundNumber}")
    public ResponseEntity<?> getPairings(@PathVariable Long tournamentId,
                                         @PathVariable Integer roundNumber) {
        return ResponseEntity.ok(swissService.getPairings(tournamentId, roundNumber));
    }

    @PutMapping("/pairings/{pairingId}/result")
    public ResponseEntity<?> updateResult(@PathVariable Long pairingId,
                                          @RequestBody Map<String, Integer> body) {
        try {
            swissService.updateSwissResult(pairingId, body.get("scoreA"), body.get("scoreB"));
            return ResponseEntity.ok(Map.of("message", "Wynik zapisany"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // W SwissController.java
    @PostMapping("/generate-next-round")
    public ResponseEntity<?> generateNextRound(@PathVariable Long tournamentId) {
        try {
            swissService.generateNextRound(tournamentId);
            return ResponseEntity.ok(Map.of("message", "Następna runda została wygenerowana"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

}
