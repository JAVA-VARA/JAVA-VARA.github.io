---
title: "football-quiz-project"
date: 2024-05-21
description: "리펙토링"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-8464666aa844"
---
각 팀별로 퀴즈에 몇명이 참여했는지 사용자에게 보여주고 싶었다.

![](/images/medium/8464666aa844/1.png)

### AS-IS

1. leagueId를 인수로 받아 해당 리그에 속하는 팀들의 list를 불러온다.
2. list를 돌면서 teamId에 따른 참여 인원 수를 DB에서 가져와 dto에 저장한다.

=> **리그에 속한 팀의 숫자만큼 서버와 DB 간 Connection이 필요**하기 때문에 이를 한번에 처리할 수 있을지 고민했다.

- **QuizHistoryRepository**

```
@Query(value = "SELECT * FROM quiz_history WHERE team_id = :teamId", 
        nativeQuery = true)
List<QuizHistory> getTotalParticipantsByTeam(Long teamId);
```

- **TeamCategoryService**

```
@Service
@RequiredArgsConstructor
public class TeamCategoryService {
    private final TeamCategoryRepository teamCategoryRepository;
    private final LeagueCategoryRepository leagueCategoryRepository;
    private final QuizHistoryRepository quizHistoryRepository;

    public List<TeamCategoryDto> getTeamCategoryListByLeague(Long leagueId) {

        LeagueCategory league = leagueCategoryRepository.findLeagueCategoryByLeagueId(leagueId);
        List<TeamCategory> teamCategoryList = teamCategoryRepository.findTeamCategoriesByLeague(league);

        List<TeamCategoryDto> teamCategories = new ArrayList<>();

        for(TeamCategory teamCategory: teamCategoryList){
            TeamCategoryDto teamCategoryDto = new TeamCategoryDto(teamCategory.getTeamId(), teamCategory.getTeamName(), teamCategory.getTeamEmblem());
            teamCategories.add(teamCategoryDto);

            List<QuizHistory> quizHistories = quizHistoryRepository.getTotalParticipantsByTeam(teamCategory.getTeamId());
            teamCategoryDto.setGameParticipants(quizHistories.size());
        }

        return teamCategories;
    }

    public String getTeamName(Long teamId){
        TeamCategory teamCategory = teamCategoryRepository.findByTeamId(teamId);
        return teamCategory.getTeamName();
    }
}
```

### TO-BE

- **QuizHistoryRepository**

QuizHisotyr data를 teamId별로 groupBy 한 후 count하여 참여 인원 수를 list에 넣어주었다. 이렇게 쿼리문을 변경함으로써 **리그 별로 한번만 db에 접근**하여 data를 가져올 수 있었다.

```
@Query("SELECT q.teamId, COUNT(q) FROM QuizHistory q WHERE q.teamId IN :teamIds GROUP BY q.teamId")
    List<Object[]> getParticipantsCountByTeams(@Param("teamIds") List<Long> teamIds);
```

- **TeamCategoryService(ver.1)**

Repository를 통해 전달받은 Object[] List를 teamId를 key 값, 참여 인원 수를 value 값으로 하는 Map에 넣어주었다.

```
public List<TeamCategoryDto> getTeamCategoryListByLeague(Long leagueId) {

        LeagueCategory league = leagueCategoryRepository.findLeagueCategoryByLeagueId(leagueId);
        List<TeamCategory> teamCategoryList = teamCategoryRepository.findTeamCategoriesByLeague(league);

        List<Object[]> results = quizHistoryRepository.getParticipantsCountByTeams(teamCategoryList.stream().map(TeamCategory::getTeamId).collect(Collectors.toList()));
        Map<Long, Long> participantsCountByTeams = new HashMap<>();
        for (Object[] result : results) {
            Long teamId = (Long) result[0];
            Long count = (Long) result[1];
            participantsCountByTeams.put(teamId, count);
        }

        List<TeamCategoryDto> teamCategories = new ArrayList<>();

        for(TeamCategory teamCategory: teamCategoryList){
            TeamCategoryDto teamCategoryDto = new TeamCategoryDto(teamCategory.getTeamId(), teamCategory.getTeamName(), teamCategory.getTeamEmblem());

            Long totalParticipantsCountByTeams = participantsCountByTeams.get(teamCategory.getTeamId());

            teamCategoryDto.setGameParticipants(Objects.requireNonNullElse(totalParticipantsCountByTeams, 0L));
            teamCategories.add(teamCategoryDto);
        }

        return teamCategories;
    }
```

- **TeamCategoryService(ver.2)**

service 로직 완성 후 intellij에서 stream, Collectors를 사용해 코드를 바꿔주었다. 역시 IDE는 intellij가 최고인 것 같다:)

```
public List<TeamCategoryDto> getTeamCategoryListByLeague(Long leagueId) {
        LeagueCategory league = leagueCategoryRepository.findLeagueCategoryByLeagueId(leagueId);
        List<TeamCategory> teamCategoryList = teamCategoryRepository.findTeamCategoriesByLeague(league);

        Map<Long, Long> participantsCountByTeams = quizHistoryRepository.getParticipantsCountByTeams(
                        teamCategoryList.stream().map(TeamCategory::getTeamId).collect(Collectors.toList()))
                .stream()
                .collect(Collectors.toMap(result -> (Long) result[0], result -> (Long) result[1]));

        return teamCategoryList.stream()
                .map(teamCategory -> new TeamCategoryDto(
                        teamCategory.getTeamId(),
                        teamCategory.getTeamName(),
                        teamCategory.getTeamEmblem(),
                        participantsCountByTeams.getOrDefault(teamCategory.getTeamId(), 0L)))
                .collect(Collectors.toList());
    }
```

끝!
