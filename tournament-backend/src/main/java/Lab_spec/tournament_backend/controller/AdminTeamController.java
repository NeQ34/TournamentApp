package Lab_spec.tournament_backend.controller;

import Lab_spec.tournament_backend.dto.MemberResponse;
import Lab_spec.tournament_backend.dto.TeamRequest;
import Lab_spec.tournament_backend.dto.TeamResponse;
import Lab_spec.tournament_backend.dto.UserSearchResponse;
import Lab_spec.tournament_backend.service.AdminTeamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminTeamController {

    private final AdminTeamService adminTeamService;

    public AdminTeamController(AdminTeamService adminTeamService) {
        this.adminTeamService = adminTeamService;
    }

    @GetMapping("/teams")
    public ResponseEntity<List<TeamResponse>> getAllTeams() {
        return ResponseEntity.ok(adminTeamService.getAllTeams());
    }

    @GetMapping("/teams/{id}")
    public ResponseEntity<TeamResponse> getTeamById(@PathVariable Long id) {
        return ResponseEntity.ok(adminTeamService.getTeamById(id));
    }

    @PostMapping("/teams")
    public ResponseEntity<TeamResponse> createTeam(@Valid @RequestBody TeamRequest request) {
        TeamResponse response = adminTeamService.createTeam(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/teams/{id}")
    public ResponseEntity<TeamResponse> updateTeam(@PathVariable Long id,
                                                   @Valid @RequestBody TeamRequest request) {
        TeamResponse response = adminTeamService.updateTeam(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/teams/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        adminTeamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/teams/{id}/members")
    public ResponseEntity<List<MemberResponse>> getTeamMembers(@PathVariable Long id) {
        return ResponseEntity.ok(adminTeamService.getTeamMembers(id));
    }

    @PostMapping("/teams/{id}/members")
    public ResponseEntity<Void> addMember(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        String email = body.get("email");
        adminTeamService.addMember(id, email);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/teams/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id,
                                             @PathVariable Long userId) {
        adminTeamService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/teams/{id}/captain/{userId}")
    public ResponseEntity<Void> changeCaptain(@PathVariable Long id,
                                              @PathVariable Long userId) {
        adminTeamService.changeCaptain(id, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/search")
    public ResponseEntity<UserSearchResponse> searchUserByEmail(@RequestParam String email) {
        return ResponseEntity.ok(adminTeamService.searchUserByEmail(email));
    }
}
