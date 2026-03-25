package Lab_spec.tournament_backend.auth;

public record RegisterRequest(
        String firstName,
        String lastName,
        String birthDate,
        String email,
        String password,
        boolean isCaptain
) {}
