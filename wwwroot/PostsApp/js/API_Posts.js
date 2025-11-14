//const API_URL = "https://api-server-2025.azurewebsites.net/api/posts";
let currentHttpError = "";
    API_URL = "http://localhost:5000/api/posts";

    function initHttpState() {
        currentHttpError = "";
        currentStatus = 0;
        error = false;
        Etag = "";
    }
    function setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            currentHttpError = xhr.responseJSON.error_description;
        else
            currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        currentStatus = xhr.status;
        error = true;
    }
    function API_getcurrentHttpError () {
        return currentHttpError; 
    }

    function API_HeadPosts() {
    return new Promise(resolve => {
        $.ajax({
            url: API_URL,
            type: 'HEAD',
            success: function (data, textStatus, jqXHR) {
                const etag = jqXHR.getResponseHeader('ETag');
                currentHttpError = "";
                resolve(etag);
            },
            error: function (xhr) {
                resolve(null);
            }
        });
    });
}

    function API_GetPosts() {
        initHttpState();
        return new Promise(resolve => {
            $.ajax({
            url: API_URL,
            success: posts => { currentHttpError = ""; resolve(posts); },
            error: (xhr) => { console.log(xhr); resolve(null); }
        });
    });
    }

    function API_GetPost(postId) {
        initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: API_URL + "/" + postId,
                success: post => { currentHttpError = ""; resolve(post); },
                error: (xhr) => { currentHttpError = xhr.responseJSON.error_description; resolve(null); }
            });
        });
    }

    function API_SavePost(post, create) {
        initHttpState();
        return new Promise(resolve => {
        $.ajax({
            url: create ? API_URL :  API_URL + "/" + post.Id,
            type: create ? "POST" : "PUT",
            contentType: 'application/json',
            data: JSON.stringify(post),
            success: (data, textStatus, jqXHR) => { 
                currentHttpError = ""; 
                const etag = jqXHR.getResponseHeader('ETag');
                resolve({ success: true, etag: etag }); 
            },
            error: (xhr) => {currentHttpError = xhr.responseJSON.error_description; resolve({success: false, etag: null}); }
        });
    });
}

    function API_DeletePost(post) {
        initHttpState();
        return new Promise(resolve => {
        $.ajax({
            url: API_URL + "/" + post.Id,
            type: "DELETE",
            contentType: 'application/json',
            data: JSON.stringify(post),
            success: (data, textStatus, jqXHR) => { 
                currentHttpError = ""; 
                const etag = jqXHR.getResponseHeader('ETag');
                resolve({ success: true, etag: etag });
            },
            error: (xhr) => {currentHttpError = xhr.statusText; resolve({ success: false, etag: null }); }
        });
    });
}
