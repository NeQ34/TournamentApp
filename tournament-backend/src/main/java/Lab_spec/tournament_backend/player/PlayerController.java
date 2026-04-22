package Lab_spec.tournament_backend.player;

import Lab_spec.tournament_backend.model.User;
import Lab_spec.tournament_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PlayerController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Pobierz tylko "użytkowników-zawodników" dodanych przez tego admina
    @GetMapping
    public List<User> getMyPlayers(@RequestParam String adminEmail) {
        return userRepository.findAll().stream()
                .filter(u -> adminEmail.equals(u.getCreatedByEmail()))
                .toList();
    }

    @PostMapping
    public User createPlayerAccount(@RequestBody User playerRequest) {
        // Tworzymy nowe konto użytkownika
        User newUser = new User();
        newUser.setFirstName(playerRequest.getFirstName());
        newUser.setLastName(playerRequest.getLastName());
        newUser.setEmail(playerRequest.getEmail());
        newUser.setNickname(playerRequest.getNickname());
        newUser.setPosition(playerRequest.getPosition());
        newUser.setBirthDate(playerRequest.getBirthDate());
        newUser.setCreatedByEmail(playerRequest.getCreatedByEmail());

        // Szyfrujemy hasło, żeby mógł się zalogować!
        newUser.setPassword(passwordEncoder.encode(playerRequest.getPassword()));

        newUser.setRole("USER"); // zawodnik to zwykły USER
        newUser.setWantsAdmin(false);

        return userRepository.save(newUser);
    }

    @DeleteMapping("/{id}")
    public void deletePlayer(@PathVariable Long id) {
        userRepository.deleteById(id);
    }
}