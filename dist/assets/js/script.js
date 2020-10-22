$(function() {
  let isArray = false;
  
  $('#modalZoomInGallery').on('show.bs.modal', function(e){
    let target = $(e.relatedTarget);
    let src = target.find('img').data('video-src') || target.find('img').data('image-list');
    let wrapper = $('#gallery-wrapper');
    
    if (!$.isArray(src)) {// video
      let h_video = $(window).innerHeight() * 0.8;
      wrapper.html('<iframe width="100%" height="'+h_video+'" src="'+src+'" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
    } 
    else { // slider
      let domImg='<div><img src="'+src[0]+'" /></div>';
      if (src.length > 1) {
        for (let i = 1; i < src.length; i++) {
          domImg += '<div><img src="'+src[i]+'" /></div>';
        }
      }
      wrapper.html(domImg);

      isArray = true;
    }
    
  })
  .on('shown.bs.modal', function(){
    if (isArray) {
      $('#gallery-wrapper').slick({
        adaptiveHeight: false
      });
    } 
  })
  .on('hidden.bs.modal', function(){
    $('#gallery-wrapper').slick('unslick');
    isArray = false
  })

  $('[data-toggle="tab"]').on('click', function(e){
    var tabContent = e.relatedTarget.attr('href');
    console.log(tabContent);
  })

});
