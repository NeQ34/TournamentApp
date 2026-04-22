package Lab_spec.tournament_backend.auth;

import Lab_spec.tournament_backend.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = authService.register(request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Rejestracja udana");
            response.put("user", Map.of(
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "email", user.getEmail(),
                    "role", user.getWantsAdmin() ? "admin" : "user"
            ));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request){
        try{
            User user = authService.login(request.email(), request.password());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Login succesfull");
            response.put("user", Map.of(
                    "firstName",user.getFirstName(),
                    "lastName",user.getLastName(),
                    "email",user.getEmail(),
                    "role",user.getWantsAdmin()? "admin" : "user"
            ));
            return ResponseEntity.ok(response);
        }catch(RuntimeException e){
            return ResponseEntity
                    .status(401)
                    .body(Map.of("message",e.getMessage()));
        }
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email){
        boolean exists = authService.checkEmailExists(email);
        if(exists){
            return ResponseEntity
                    .status(409)
                    .body(Map.of("message", "Email already exists"));
        }
        return ResponseEntity
                .ok()
                .body(Map.of("message", "Email dostępny"));
    }
}
