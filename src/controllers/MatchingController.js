import MatchingService from "#services/MatchingService.js";
import UserService from "#services/UserService.js";

async function runMatching(_request, response) {
    try {
        const users = await UserService.getToMatch();
        const matchingResult = await MatchingService.runMatching(users);
        
        return response.json(matchingResult);
    } catch (error) {
        console.error("Error in MatchingController.runMatching:");
        console.error(error);
        return response.sendStatus(500);
    }
}

export default { runMatching };
