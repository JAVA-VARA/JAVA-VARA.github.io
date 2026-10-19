---
title: "football-quiz-project"
date: 2024-05-20
description: "Selenium으로 크롤링하기"
source: medium
original: "https://medium.com/@sj.youns1027/football-quiz-project-x-846c7845e1ea"
---
selenium을 이용해 웹사이트에서 축구 선수의 정보를 크롤링하는 서비스 로직을 만들었다.

### as-is

하나의 메서드 안에 web driver 연결부터 선수 데이터 수집, 저장까지 모든 기능들이 합쳐져 있다.

아래 코드는 프리미어리그에 속한 선수들의 정보를 수집하는 코드이지만, 앞으로 스페인, 프랑스, 독일 등 여러 국가의 축구 리그에서 선수들의 정보를 수집하고 싶어 코드의 재사용성을 높이고자 리펙토링을 하게 되었다.

```
@Service
@RequiredArgsConstructor
public class CollectPremierLeaguePlayers {
    private final static String WEB_DRIVER_PATH = "C:\\Users\\sjyou\\Downloads\\chromedriver-win64\\chromedriver.exe";
    private final TeamCategoryRepository teamCategoryRepository;
    private final PlayersRepository playersRepository;

    public List<Players> PremierLeaguePlayersData() throws InterruptedException {

        String URL_ARS = "https://www.premierleague.com/clubs/1/Arsenal/squad?se=578";

        System.setProperty("webdriver.chrome.driver", WEB_DRIVER_PATH);
        WebDriver driver = new ChromeDriver();

        driver.get(URL_ARS);
        Thread.sleep(5000);

        JavascriptExecutor js = (JavascriptExecutor) driver;
        Long pageHeight = (Long) js.executeScript("return document.body.scrollHeight");

        for (int i = 0; i < pageHeight; i += 1000) {
            js.executeScript("window.scrollTo(0, " + i + ")");
            Thread.sleep(500); // 스크롤 시간을 기다림 (필요에 따라 조절)
        }

        List<WebElement> elements = driver.findElements(By.cssSelector("#mainContent > div.wrapper.col-12 > div > ul > div > ul > li > a > div > div.stats-card__top-section > div.stats-card__player-image.js-featured-player-image.t3 > img"));
        List<WebElement> elementTeam = driver.findElements(By.cssSelector("#mainContent > header.club-header.club-header--t3"));

        String header = elementTeam.get(0).getText();

        String[] headerInfo = header.split("\n") ;
        String teamname = headerInfo[0];

        TeamCategory team = teamCategoryRepository.findTeamCategoriesByTeamName(teamname);

        List<Players> playersInfoList = new ArrayList<>();
        for (WebElement element : elements) {

            String playerImage = element.getAttribute("src");
            String playerName = element.getAttribute("alt");

            Players player = Players.builder()
                    .imageUrl(playerImage) // 이미지 링크
                    .name(playerName)// 이름
                    .team(team)
                    .build();

            playersInfoList.add(player);

        }

        driver.close();
        driver.quit();

        playersRepository.saveAll(playersInfoList);

        return playersInfoList;

    }
```

### to-be

메서드 내에서 수행하는 역할에 따라 총 4가지의 메서드로 구분했다.

- web driver 연결 기능
- 웹 페이지 스크롤하는 기능: 동적인 웹 페이지 스크롤링 시에만 필요하므로 별도의 메서드로 만들었다.
- 선수 정보 저장 기능
- 선수의 정보를 저장할 팀 정보를 가져오는 기능

```
@Service
@RequiredArgsConstructor
public class CollectPremierLeaguePlayers {
    private final static String WEB_DRIVER_PATH = "C:\\Users\\sjyou\\Downloads\\chromedriver-win64\\chromedriver.exe";
    private final TeamCategoryRepository teamCategoryRepository;
    private final PlayersRepository playersRepository;
    private final WebDriverUtil webDriverUtil;

    public List<Players> PremierLeaguePlayersData(String URL) throws InterruptedException {

        String PLAYER_IMAGE_URL_CSSSELECTOR = "#mainContent > div.wrapper.col-12 > div > ul > div > ul > li > a > div > div.stats-card__top-section > div > img.statCardImg.statCardPlayer";
        String TEAM_CSSSELECTOR = "#mainContent > header > div.club-header__content > div > h2";
        WebDriver driver = webDriverUtil.connectingDriver(URL);
        webDriverUtil.scrollDriver(driver);

        List<WebElement> elementsPlayers = driver.findElements(By.cssSelector(PLAYER_IMAGE_URL_CSSSELECTOR));
        List<WebElement> elementsTeam = driver.findElements(By.cssSelector(TEAM_CSSSELECTOR));

        List<Players> playersInfoList = savePlayersData(elementsPlayers,elementsTeam);

        driver.close();
        driver.quit();

        playersRepository.saveAll(playersInfoList);

        return playersInfoList;
    }

    private WebDriver connectingDriver(String url) throws InterruptedException {
        System.setProperty("webdriver.chrome.driver", WEB_DRIVER_PATH);
        WebDriver driver = new ChromeDriver();
        driver.get(url);
        Thread.sleep(1000);

        return driver;
    }

    private void scrollDriver(WebDriver driver) throws InterruptedException {
        JavascriptExecutor js = (JavascriptExecutor) driver;
        Long pageHeight = (Long) js.executeScript("return document.body.scrollHeight");

        for (int i = 0; i < pageHeight; i += 1000) {
            js.executeScript("window.scrollTo(0, " + i + ")");
            Thread.sleep(500); // 스크롤 시간을 기다림 (필요에 따라 조절)
        }
    }

    private List<Players> savePlayersData(List<WebElement> elementsPlayers, List<WebElement> elementsTeam){
        TeamCategory team = getTeamInfo(elementsTeam);

        List<Players> playersInfoList = new ArrayList<>();
        for (WebElement element : elementsPlayers) {

            String playerImage = element.getAttribute("src");
            String playerName = element.getAttribute("alt");

            Players player = Players.builder()
                    .imageUrl(playerImage) // 이미지 링크
                    .name(playerName)// 이름
                    .team(team)
                    .build();

            playersInfoList.add(player);
        }
        return playersInfoList;
    }

    private TeamCategory getTeamInfo(List<WebElement> elements){
        String teamName = elements.get(0).getText();
        return teamCategoryRepository.findTeamCategoriesByTeamName(teamName);
    }

}
```
