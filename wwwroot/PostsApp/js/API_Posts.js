//const API_URL = "hhttps://api-server-2025.azurewebsites.net/api/contacts";
let currentHttpError = "";
class Posts_API {
    static API_URL() { return "http://localhost:5000/api/posts"};

    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
        this.Etag = "";
    }
    static setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            this.currentHttpError = xhr.responseJSON.error_description;
        else
            this.currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        this.currentStatus = xhr.status;
        this.error = true;
    }
    static API_getcurrentHttpError () {
        return this.currentHttpError; 
    }

    static async API_GetPosts() {
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
            url: this.API_URL(),
            success: posts => { this.currentHttpError = ""; resolve(posts); },
            error: (xhr) => { console.log(xhr); resolve(null); }
        });
    });
    }

    static async API_GetPost(postId) {
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + "/" + postId,
                success: post => { this.currentHttpError = ""; resolve(post); },
                error: (xhr) => { this.currentHttpError = xhr.responseJSON.error_description; resolve(null); }
            });
        });
    }

    static async API_SavePost(post, create) {
        this.initHttpState();
        return new Promise(resolve => {
        $.ajax({
            url: create ? this.API_URL() :  this.API_URL() + "/" + post.Id,
            type: create ? "POST" : "PUT",
            contentType: 'application/json',
            data: JSON.stringify(post),
            success: (/*data*/) => { this.currentHttpError = ""; resolve(true); },
            error: (xhr) => {this.currentHttpError = xhr.responseJSON.error_description; resolve(false /*xhr.status*/); }
        });
    });
}

    static async API_DeletePost(id) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
        $.ajax({
            url: this.API_URL() + "/" + id,
            type: "DELETE",
            success: () => { this.currentHttpError = ""; resolve(true); },
            error: (xhr) => {this.currentHttpError = xhr.responseJSON.error_description; resolve(false /*xhr.status*/); }
        });
    });
    }
}