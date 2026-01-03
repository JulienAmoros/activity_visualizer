import { start } from 'node:repl';
import { Activity } from './Activity';

export class TrelloApi {
    private readonly DEFAULT_COMMENT_DURATION_MINUTES = 10;
    private readonly FETCH_LIMIT = 1000; // Max is 1000
    private apiKey: string;
    private authToken: string;
    private username: string;

    constructor(apiKey: string, authToken: string, username: string) {
        this.apiKey = apiKey;
        this.authToken = authToken;
        this.username = username;
    }

    async fetchActivities(): Promise<Activity[]> {
        const activities: Activity[] = [];

        // Fetch boards
        const endDate = new Date();
        const endDateStr = formatDate(endDate);
        const startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 3);
        const startDateStr = formatDate(startDate);
        const commentsResponse = await fetch(`https://api.trello.com/1/members/${this.username}/actions?filter=commentCard&member=false&memberCreator=false&limit=${this.FETCH_LIMIT}&since=${startDateStr}&before=${endDateStr}&key=${this.apiKey}&token=${this.authToken}`);
        const comments = await commentsResponse.json();

        // Transform comments into activities
        comments.forEach((comment: any, index: number) => {
            const commentDate = new Date(comment.date);
            const startDate = new Date(commentDate);
            startDate.setMinutes(commentDate.getMinutes() - this.DEFAULT_COMMENT_DURATION_MINUTES);
            const title = `Trello Comment on ${comment.data.card.name}` || "Untitled";
            const description = `Board: ${comment.data.board?.name || "Unknown Board"}`;
            const location = `Card URL: https://trello.com/c/${comment.data.card?.shortLink || ""}`;

            activities.push({
                id: `trello-comment-${comment.id}`,
                title,
                start: startDate,
                end: commentDate,
                description: description,
                location: location,
                source: "trello"
            });
        });

        return activities;

        function formatDate(date: Date): string {
            return date.toISOString().split("T")[0];
        }
    }
}
