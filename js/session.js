export class SessionData {
    constructor() {
        const params = new URLSearchParams(window.location.search);
        this.meetupCode = params.get("code");
        this.userId = this.getOrCreateUserId();
    }

    getMeetupCode() {
        return this.meetupCode;
    }

    setMeetupCode(code) {
        this.meetupCode = code;
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem("user_id");
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem("user_id", userId);
        }
        return userId;
    }
}