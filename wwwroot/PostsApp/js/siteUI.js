let contentScrollPosition = 0;
let selectedCategory = "";
let currentETag = "";
Init_UI();

function Init_UI() {
    renderPosts();
    $('#createPost').on("click", async function () {
        saveContentScrollPosition();
        renderCreatePostForm();
    });
    //Activer la barre de recherche
    $('#search').on("click", async function () {
        toggleSearch();
    });

    $('#abort').on("click", async function () {
        renderPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });

    //C'est pour le dynamisme (pour les chose ajouté au dom)

    $(document).on('click', '.toggle-btn', function() {
        const $btn = $(this);
        const $postText = $btn.closest('.postContent').find('.post-text');        
        // Alterne entre hideExtra et showExtra
        $postText.toggleClass('hideExtra showExtra');
        
        // Alterne entre les boutons
        $btn.siblings('.toggle-btn').toggle();
        $btn.toggle();
    });
}

function toggleSearch() {
    let searchBar = $("#searchContainer #search");
    if (searchBar.length > 0) {
        // If search bar exists, remove it and clear highlights
        searchBar.remove();
        if (window.removeHighlights)
            window.removeHighlights();
        renderPosts();
    } else {
        saveContentScrollPosition();
        $("#createPost").hide();
        $("#abort").show();
        $("#searchContainer").append(
            $(`
                <div id="search">
                    <div style="display:grid; grid-template-columns: 1fr; gap: 8px;">
                        <input type="search" placeholder="Mot-clé, etc..." name="searchToken" id="searchToken" class="form-control" style="width:100%;" />
                    </div>
                </div>
            `)
        );

        renderPosts();

        $('#searchToken').on('input', function () {
            const value = $(this).val();
            if (!value || value.trim().length === 0) {
                if (window.removeHighlights)
                    window.removeHighlights();
            } else {
                if (window.highlightKeywords)
                    window.highlightKeywords(value);
            }
        });
    }
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
function updateDropDownMenu(categories) {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    $('#allCatCmd').on("click", function () {
        selectedCategory = "";
        renderPosts();
    });
    $('.category').on("click", function () {
        selectedCategory = $(this).text().trim();
        renderPosts();
    });
}
function compileCategories(posts) {
    let categories = [];
    if (posts != null) {
        posts.forEach(post => {
            if (!categories.includes(post.Category))
                categories.push(post.Category);
        })
        updateDropDownMenu(categories);
    }
}
async function renderPosts() {
    showWaitingGif();
    $("#actionTitle").text("Liste des posts");
    $("#createPost").show();
    $("#abort").hide();
    let posts = await Posts_API.API_GetPosts();
    //currentETag = Bookmarks_API.Etag;
    compileCategories(posts);
    eraseContent();
    if (posts !== null) {
        posts.forEach(post => {
            if ((selectedCategory === "") || (selectedCategory === post.Category))
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
    let post = await Posts_API.API_GetPost(id);
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
    let post = await Posts_API.API_GetPost(id);
    eraseContent();
    if (post !== null) {

        //fonctionne pas complètement avec le format de la date
        const creationDate = post.Creation ? convertToFrenchDate(post.Creation * 1000) : 'Date inconnue';
        $("#content").append(`
        <div class="postdeleteForm">
            <h4>Effacer le post suivant?</h4>
            <br>
            <div class="postRow" post_id="${post.Id}">
                <div class="postContainer">
                    <div class="postContent">
                        <div class="post-header">
                            <span class="post-category">${post.Category || 'Général'}</span>
                            <span class="post-date">${creationDate}</span>
                        </div>
                        <h3 class="post-title">${post.Title}</h3>
                        ${post.Image ? `<img src="${post.Image}" alt="${post.Title}" class="post-image">` : ''}
                        <p class="post-text">${post.Text}</p>
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
            let result = await Posts_API.API_DeletePost(post.Id);
            if (result)
                renderPosts();
            else{
                alert(Posts_API.API_currentHttpError || "Impossible de supprimer le post.");
                renderPosts(); 
            }
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
            <div class='imageUploader'
                 controlId='Image'
                 imageSrc='${post.Image}'
                 newImage='${create}' 
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
        let result = await Posts_API.API_SavePost(post, create); //Changer par API_SavePost
        if (result)
            renderPosts();
        else
            renderError("Une erreur est survenue! " + Posts_API.API_getcurrentHttpError());
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
    // fonctionne pas encore, mais j'y travaille
    let creationDate;
    if(post.Creation && post.Creation > 0)
        creationDate = convertToFrenchDate(post.Creation * 1000);
    else 
        creationDate = 'Date inconnue';

    const imageSrc = post.Image && (post.Image.startsWith('data:image/') ?
        post.Image : 
        post.Image.startsWith('http') ? 
        post.Image : 
        `/assetsRepository/${post.Image}`);

    let $post = $(`
        <div class="postRow" id="post_${post.Id}">
            <div class="postContainer">
                <div class="postContent">
                    <div class="post-header">
                        <span class="post-category">${post.Category || 'Général'}</span>
                        <span class="post-date">${creationDate}</span>
                    </div>
                    <h3 class="post-title">${post.Title}</h3>
                    ${post.Image ? `<img src="${imageSrc}" alt="${post.Title}" class="post-image">` : ''}
                    <div class="post-text-container">
                        <p class="post-text hideExtra">${post.Text}</p>
                    </div>
                    <div class="text-toggle">
                        <img src="downArrows.png" alt="Show more text" class="toggle-btn" title="Afficher plus" data-expanded="false">
                        <img src="upArrow.png" alt="Show less" class="toggle-btn" style="display: none;" title="Afficher moins" data-expanded="true">
                    </div>
                </div>
                <div class="post-actions">
                    <i class="fas fa-edit action-icon" title="Modifier"></i>
                    <i class="fas fa-trash action-icon" title="Supprimer"></i>
                </div>
            </div>
        </div>
    `);
    
    // pour le look
    $post.hover(
        function() {
            $(this).find('.action-icon').css('opacity', '1');
        },
        function() {
            $(this).find('.action-icon').css('opacity', '0');
        }
    );
    
    // pour les events
    $post.find('.fa-edit').on('click', (e) => {
        e.stopPropagation();
        saveContentScrollPosition();
        renderEditPostForm(post.Id);
    });
    
    $post.find('.fa-trash').on('click', (e) => {
        e.stopPropagation();
        renderDeletePostForm(post.Id);
    });
    
    return $post;
}