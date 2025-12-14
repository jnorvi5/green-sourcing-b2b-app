class LinkedInClient {
    private accessToken: string;

    constructor() {
        this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN!;
    }

    async createPost(params: {
        authorUrn: string; // Your LinkedIn URN
        text: string;
        imageUrl?: string;
    }) {
        if (!this.accessToken) {
            console.warn("LinkedIn access token missing");
            return { error: "Missing Token" };
        }

        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify({
                author: params.authorUrn,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: params.text
                        },
                        shareMediaCategory: 'NONE'
                    }
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                }
            })
        });

        return response.json();
    }
}

export const linkedInClient = new LinkedInClient();
