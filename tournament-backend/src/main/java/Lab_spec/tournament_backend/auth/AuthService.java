package Lab_spec.tournament_backend.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import Lab_spec.tournament_backend.model.User;
import Lab_spec.tournament_backend.repository.UserRepository;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setBirthDate(LocalDate.parse(request.birthDate()));
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setWantsAdmin(request.isCaptain());
        user.setRole(request.isCaptain() ? "ADMIN" : "USER");

        return userRepository.save(user);
    }

    public User login(String email, String password){
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Nieprawidlowy email lub haslo"));

        if(!passwordEncoder.matches(password, user.getPassword())){
            throw new RuntimeException("Nieprawidlowy email lub haslo");
        }
        return user;
    }

    public boolean checkEmailExists(String email){
        return userRepository.existsByEmail(email);
    }
}
