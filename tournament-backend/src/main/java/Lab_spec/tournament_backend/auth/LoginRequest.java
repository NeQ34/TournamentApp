package Lab_spec.tournament_backend.auth;

public record LoginRequest (
    String email,
    String password
){}
