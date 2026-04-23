package Lab_spec.tournament_backend.controller;

import Lab_spec.tournament_backend.dto.TeamRequest;
import Lab_spec.tournament_backend.dto.TeamResponse;
import Lab_spec.tournament_backend.service.AdminTeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teams")
@CrossOrigin(origins = "http://localhost:5173")
public class TeamController {

    private final AdminTeamService adminTeamService;

    public TeamController(AdminTeamService adminTeamService) {
        this.adminTeamService = adminTeamService;
    }

    @GetMapping
    public ResponseEntity<java.util.List<TeamResponse>> getActiveTeams() {
        return ResponseEntity.ok(adminTeamService.getActiveTeams());
    }

    @PostMapping("/request")
    public ResponseEntity<TeamResponse> requestTeam(@Valid @RequestBody TeamRequest request) {
        TeamResponse response = adminTeamService.requestTeam(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}