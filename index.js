const homeTeamText = [];
const awayTeamText = [];
const homeTeamxG = [];
const awayTeamxG = [];
loadTeams();

async function loadTeams(){

    try{
                
        

        const response = await fetch("https://api.s6.sbgservices.com/v2/round/active")
        
        if(!response.ok){
            throw new Error("Could not fetch data")
        }

        const data = await response.json();

        for (let i = 0; i < 6; i++){
            const n = i + 1; 
            homeTeamText[i] = data.scoreChallenges.at(i).match.homeTeam.name;
            const homeTeamImg = data.scoreChallenges.at(i).match.homeTeam.badgeUri;
            const homeTeamTextElement = document.querySelector(`#homeTeam${n} p`);
            const homeTeamImgElement = document.querySelector(`#homeTeam${n} img`);
            awayTeamText[i] = data.scoreChallenges.at(i).match.awayTeam.name;
            const awayTeamImg = data.scoreChallenges.at(i).match.awayTeam.badgeUri;
            const awayTeamTextElement = document.querySelector(`#awayTeam${n} p`);
            const awayTeamImgElement = document.querySelector(`#awayTeam${n} img`);
            homeTeamTextElement.textContent = homeTeamText[i];
            homeTeamImgElement.src = homeTeamImg;
            awayTeamTextElement.textContent = awayTeamText[i];
            awayTeamImgElement.src = awayTeamImg;
        }
        

    }
    catch(error){

    }
    
}

const generateButton = document.querySelector("#generate");
generateButton.addEventListener("click", generate);

async function generate(){

    try{
        
        
        const teamNames = {
            "Nottm Forest": "Nottingham",
            "Leeds": "Leeds United",
            "Brighton": "Brighton Hove",
            "Spurs": "Tottenham",
            "Coventry": "Coventry City",
            "Hull": "Hull City",
            "Man Utd": "Man United",
            "Ipswich": "Ipswich Town"
        }

        const response = await fetch("https://pitchodds.app/api/v1/fixtures")
        
        if(!response.ok){
            throw new Error("Could not fetch data")
        }

        const data = await response.json();  
        for (let i = 0; i < 6; i++){
            const n = i + 1;
            const homeName = teamNames[homeTeamText[i]] ?? homeTeamText[i];
            const awayName = teamNames[awayTeamText[i]] ?? awayTeamText[i];
            const match = data.fixtures.find(fixture => 
                fixture.home === homeName
                &&
                fixture.away === awayName
            );
            homeTeamxG[i] = match.expectedGoals.home;
            awayTeamxG[i] = match.expectedGoals.away;
            const matchRandomnessElement = document.getElementById(`randomness${n}`).value;
            let homeTeamGoals = 0;
            let awayTeamGoals = 0;
            if(matchRandomnessElement === "very-conservative"){
                const homeLambda = 29.775 * Math.pow(homeTeamxG[i], 5.607);
                const awayLambda = 29.775 * Math.pow(awayTeamxG[i], 5.607);
                homeTeamGoals = generateGoalsConservative(homeLambda, 8);
                awayTeamGoals = generateGoalsConservative(awayLambda, 8);
            }else if(matchRandomnessElement === "conservative"){
                const homeLambda = 2.35 * Math.pow(homeTeamxG[i], 1.855);
                const awayLambda = 2.35 * Math.pow(awayTeamxG[i], 1.855);
                homeTeamGoals = generateGoalsConservative(homeLambda, 2.5);
                awayTeamGoals = generateGoalsConservative(awayLambda, 2.5);
            }else if(matchRandomnessElement === "poisson"){
                homeTeamGoals = generateGoalsPoisson(homeTeamxG[i]);
                awayTeamGoals = generateGoalsPoisson(awayTeamxG[i]);
            }else if(matchRandomnessElement === "match-xg"){
                homeTeamGoals = Math.round(homeTeamxG[i]);
                awayTeamGoals = Math.round(awayTeamxG[i]);
            }else{
                homeTeamGoals = Math.floor(Math.random() * 7);
                awayTeamGoals = Math.floor(Math.random() * 7);
            }
            
            const homeTeamGoalsElement = document.getElementById(`homeScore${n}`);
            const awayTeamGoalsElement = document.getElementById(`awayScore${n}`);
            homeTeamGoalsElement.textContent = homeTeamGoals;
            awayTeamGoalsElement.textContent = awayTeamGoals;
            console.log(homeTeamxG);
            console.log(awayTeamxG);
        }

    }
    catch(error){

    }
       
}

function generateGoalsConservative(lambda, concentration) {
    const weights = [];
    for (let goals = 0; goals <= 8; goals++) {
        weights[goals] = Math.pow(lambda, goals) / Math.pow(factorial(goals), concentration);
        
    }
    const normalisedWeights = normalise(weights);
    const randomNumber = Math.random();
    
    let probXGoals = 0;
    let goalsFound = false;
    let goals =-1;
    do {
        goals += 1;
        probXGoals = probXGoals + normalisedWeights[goals];
        if(probXGoals > randomNumber){
            goalsFound = true;
        }
    } while(!goalsFound)
    
    return goals;
}

function generateGoalsPoisson(xG) {
    const randomNumber = Math.random();
    const lambda = xG;

    let probXGoals = 0;
    let goalsFound = false;
    let goals = -1;

    do {
        goals += 1;
        probXGoals = probXGoals + ((Math.pow(lambda, goals) * Math.exp(-lambda)) / factorial(goals));

        if (probXGoals > randomNumber) {
            goalsFound = true;
        }
    } while (!goalsFound)

    return goals;
    
}

function factorial(n) {
    let result = 1;

    for (let i = 2; i <= n; i++) {
        result *= i;
    }

    return result;
}

function normalise(weights){
    const normalisedWeights = [];
    const total = weights.reduce((accumulator, current) => accumulator + current, 0);
    for(let goals = 0; goals <= 8; goals++)
        normalisedWeights[goals] = (weights[goals])/(total)
    return normalisedWeights;
}