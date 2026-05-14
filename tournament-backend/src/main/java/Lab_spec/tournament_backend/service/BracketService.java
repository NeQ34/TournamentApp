package Lab_spec.tournament_backend.service;

import Lab_spec.tournament_backend.model.Match;
import Lab_spec.tournament_backend.model.Team;
import Lab_spec.tournament_backend.model.Tournament;
import Lab_spec.tournament_backend.repository.MatchRepository;
import Lab_spec.tournament_backend.repository.TeamRepository;
import Lab_spec.tournament_backend.repository.TournamentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class BracketService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;

    public BracketService(MatchRepository matchRepository,
                          TournamentRepository tournamentRepository,
                          TeamRepository teamRepository) {
        this.matchRepository = matchRepository;
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
    }

    @Transactional
    public void generateBracket(Long tournamentId, boolean randomize) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Turniej nie znaleziony"));

        List<Team> teams = new ArrayList<>(tournament.getTeams());

        if (teams.size() < 2) {
            throw new RuntimeException("Za mało drużyn do wygenerowania drabinki (minimum 2)");
        }

        // Usuń stare mecze
        matchRepository.deleteByTournamentId(tournamentId);

        // Losowanie lub zachowanie kolejności
        if (randomize) {
            Collections.shuffle(teams);
        }

        // Uzupełnienie do potęgi dwójki (BYE)
        int size = teams.size();
        int nextPowerOfTwo = 1;
        while (nextPowerOfTwo < size) {
            nextPowerOfTwo <<= 1;
        }

        List<Team> allTeams = new ArrayList<>(teams);
        for (int i = size; i < nextPowerOfTwo; i++) {
            allTeams.add(null); // BYE = automatyczny awans
        }

        // I runda
        List<Match> roundMatches = new ArrayList<>();
        int matchOrder = 0;
        for (int i = 0; i < allTeams.size(); i += 2) {
            Match match = new Match();
            match.setTournament(tournament);
            match.setTeamA(allTeams.get(i));
            match.setTeamB(allTeams.get(i + 1));
            match.setRoundNumber(1);
            match.setMatchOrder(matchOrder++);
            match.setStatus("pending");
            roundMatches.add(match);
        }

        List<Match> allMatches = new ArrayList<>(roundMatches);

        // Kolejne rundy
        int round = 2;
        while (roundMatches.size() > 1) {
            List<Match> nextRound = new ArrayList<>();
            int nextMatchOrder = 0;
            for (int i = 0; i < roundMatches.size(); i += 2) {
                Match match = new Match();
                match.setTournament(tournament);
                match.setRoundNumber(round);
                match.setMatchOrder(nextMatchOrder++);
                match.setStatus("pending");

                // Podłączenie do poprzednich meczów
                if (i < roundMatches.size()) {
                    roundMatches.get(i).setNextMatchId(null); // będzie ustawione po zapisie
                }
                if (i + 1 < roundMatches.size()) {
                    roundMatches.get(i + 1).setNextMatchId(null);
                }

                nextRound.add(match);
            }
            allMatches.addAll(nextRound);
            roundMatches = nextRound;
            round++;
        }

        // Zapisz wszystkie mecze
        List<Match> savedMatches = matchRepository.saveAll(allMatches);

        // Ustaw nextMatchId
        int matchIndex = 0;
        int roundSize = allTeams.size() / 2;
        int matchesPerRound = roundSize;

        for (int r = 1; r < round; r++) {
            int nextRoundStart = matchIndex + matchesPerRound;
            for (int i = 0; i < matchesPerRound; i++) {
                Match currentMatch = savedMatches.get(matchIndex + i);
                if (nextRoundStart + i / 2 < savedMatches.size()) {
                    currentMatch.setNextMatchId(savedMatches.get(nextRoundStart + i / 2).getId());
                }
            }
            matchIndex += matchesPerRound;
            matchesPerRound /= 2;
        }

        matchRepository.saveAll(savedMatches);
    }

    public List<Match> getBracket(Long tournamentId) {
        return matchRepository.findByTournamentIdOrderByRoundNumberAscMatchOrderAsc(tournamentId);
    }

    @Transactional
    public void updateMatchResult(Long matchId, String result, Long winnerId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Mecz nie znaleziony"));

        match.setResult(result);
        match.setStatus("completed");

        Team winner = teamRepository.findById(winnerId)
                .orElseThrow(() -> new RuntimeException("Drużyna nie znaleziona"));

        match.setWinner(winner);

        // Przejście do następnego meczu
        if (match.getNextMatchId() != null) {
            Match nextMatch = matchRepository.findById(match.getNextMatchId())
                    .orElseThrow(() -> new RuntimeException("Następny mecz nie znaleziony"));

            if (nextMatch.getTeamA() == null) {
                nextMatch.setTeamA(winner);
            } else if (nextMatch.getTeamB() == null) {
                nextMatch.setTeamB(winner);
            }
            matchRepository.save(nextMatch);
        }

        matchRepository.save(match);
    }
}