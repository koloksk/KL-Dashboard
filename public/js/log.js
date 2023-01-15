function showoptions(element){
    if(window.innerWidth < 767)
    var optionsdisplay = element.parentElement.querySelector(".options").style.display;
    if(optionsdisplay == "block")
      element.parentElement.querySelector(".options").style.display = "none";
    else {
      element.parentElement.querySelector(".options").style.display = "block";
  
    }
  }