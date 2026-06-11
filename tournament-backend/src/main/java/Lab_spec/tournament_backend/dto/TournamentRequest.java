package Lab_spec.tournament_backend.dto;

import java.time.LocalDate;

public class TournamentRequest {
    private String name;
    private String discipline;
    private LocalDate startDate;
    private LocalDate endDate;
    private String location;
    private String description;
    private String status;
    private Integer maxTeams;
    private String bracketType;

    // Getters i Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDiscipline() { return discipline; }
    public void setDiscipline(String discipline) { this.discipline = discipline; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getMaxTeams() { return maxTeams; }
    public void setMaxTeams(Integer maxTeams) { this.maxTeams = maxTeams; }

    public String getBracketType() {
        return bracketType;
    }

    public void setBracketType(String bracketType) {
        this.bracketType = bracketType;
    }
}