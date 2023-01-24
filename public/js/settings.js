$("form").submit(function(e) {
    e.preventDefault(); // zapobiega domyślnemu zachowaniu formularza
    $.ajax({
        type: "POST",
        url: "settings",
        data: $(this).serialize(), // serializuje dane formularza
        success: function(response) {
            console.log("Formularz został wysłany");
            Toastify({
                text: "Zapisano ustawienia",
                duration: 3000,
                gravity: "top", // `top` or `bottom`
                position: "right", // `left`, `center` or `right`
                stopOnFocus: true, // Prevents dismissing of toast on hover
                style: {
                  background: "linear-gradient(to right, #00b09b, #96c93d)",
                },
                onClick: function(){} // Callback after click
              }).showToast();
        }
    });
});