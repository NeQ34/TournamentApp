package Lab_spec.tournament_backend.controller;

import Lab_spec.tournament_backend.service.ReportsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ReportsController {

    private final ReportsService reportsService;

    @GetMapping("/global-summary")
    public ResponseEntity<Map<String, Object>> getGlobalSummary() {
        return ResponseEntity.ok(reportsService.getGlobalSummary());
    }

    @GetMapping("/team-stats/{teamId}")
    public ResponseEntity<Map<String, Object>> getTeamStats(@PathVariable Long teamId) {
        return ResponseEntity.ok(reportsService.getTeamStats(teamId));
    }
}