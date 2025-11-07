//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
Init_UI();

function Init_UI() {
    renderPosts();
    $('#createPost').on("click", async function () {
        saveContentScrollPosition();
        renderCreatePostForm();
    });
    $('#abort').on("click", async function () {
        renderPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createPost").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Fil de post d'actualité</h2>
                <hr>
                <p>
                    Petite application de fil d'actualité pour la publication de posts
                    pour le TP en Web échange de données.
                </p>
                <p>
                    Auteur: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, Hiver 2025
                </p>
            </div>
        `))
}
async function renderPosts() {
    showWaitingGif();
    $("#actionTitle").text("Liste des posts");
    $("#createPost").show();
    $("#abort").hide();
    let posts = await API_GetPosts();
    eraseContent();
    if (posts !== null) {
        posts.forEach(post => {
            $("#content").append(renderPost(post));
        });
        restoreContentScrollPosition();
        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditPostForm($(this).attr("editPostId"));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeletePostForm($(this).attr("deletePostId"));
        });
        $(".postRow").on("click", function (e) { e.preventDefault(); })
    } else {
        renderError("Service introuvable");
    }
}
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreatePostForm() {
    renderPostForm();
}
async function renderEditPostForm(id) {
    showWaitingGif();
    let post = await API_GetPost(id);
    if (post !== null)
        renderPostForm(post);
    else
        renderError("Post introuvable!");
}
async function renderDeletePostForm(id) {
    showWaitingGif();
    $("#createPost").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let post = await API_GetPost(id); //Changer API_GetContact par API_GetPost
    eraseContent();
    if (post !== null) {
        $("#content").append(`
        <div class="postdeleteForm">
            <h4>Effacer le post suivant?</h4>
            <br>
            <div class="postRow" post_id=${post.Id}">
                <div class="postContainer">
                    <div class="postLayout">
                        <div class="postCategory">${post.Category}</div>
                        <div class="postTitle">${post.Title}</div>
                        <div class="Image" style="background-image:url('${post.Image}')"></div>
                        <div class="postDate">${post.Creation}</div>
                        <div class="postText">${post.Text}</div>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deletePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deletePost').on("click", async function () {
            showWaitingGif();
            let result = await API_DeletePost(post.Id);
            if (result)
                renderPosts();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderPosts();
        });
    } else {
        renderError("Post introuvable!");
    }
}
function newPost() {
    post = {};
    post.Id = 0;
    post.Title = "";
    post.Text = "";
    post.Category = "";
    post.Image = "./news-logo-upload.png";//Peut être change en image par defaut
    post.Creation = 0;

    return post;
}
function renderPostForm(post = null) {
    $("#createPost").hide();
    $("#abort").show();
    eraseContent();
    let create = post == null;
    if (create) {
        post = newPost();
        post.Image = "./news-logo-upload.png"; //Changer l'image par défault
    }
    $("#actionTitle").text(create ? "Ajout" : "Modification");
    $("#content").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>
            <input type="hidden" name="Creation" value="${post.Creation}"/>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control Alpha"
                name="Category" 
                id="Category" 
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie"
                InvalidMessage="La catégorie comporte un caractère illégal" 
                value="${post.Category}"
            />
            <label for="Title" class="form-label">Titre </label>
            <input
                class="form-control Alpha"
                name="Title"
                id="Title"
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre" 
                InvalidMessage="Veuillez entrer un titre valide"
                value="${post.Title}" 
            />
            <label for="Text" class="form-label">Texte </label>
            <input 
                class="form-control Alpha"
                name="Text"
                id="Text"
                placeholder="Texte"
                required
                RequireMessage="Veuillez entrer du texte" 
                InvalidMessage="Veuillez entrer du texte valide"
                value="${post.Text}"
            />
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Image </label>
            <div   class='imageUploader' 
                   newImage='${create}' 
                   controlId='Image' 
                   imageSrc='${post.Image}' 
                   waitingImage="Loading_icon.gif">
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    initFormValidation(); // important do to after all html injection!
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        showWaitingGif();
        let result = await API_SavePost(post, create); //Changer par API_SavePost
        if (result)
            renderPosts();
        else
            renderError("Une erreur est survenue! " + API_getcurrentHttpError());
    });
    $('#cancel').on("click", function () {
        renderPosts();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderPost(post) {
    return $(`
     <div class="postRow" post_id=${post.Id}">
        <div class="postContainer noselect">
            <div class="postLayout">
                <div class="postTitle">${post.Title}</div>
                <div class="Image" style="background-image:url('${post.Image}')"></div>
                <div class="postDate">${post.Creation}</div>
                <div class="postText">${post.Text}</div>
            </div>
            <div class="postCommandPanel">
                <span class= "Category">${post.Category}</span>
                <span class="editCmd cmdIcon fa fa-pencil" editPostId="${post.Id}" title="Modifier ${post.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deletePostId="${post.Id}" title="Effacer ${post.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}