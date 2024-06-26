import { isEscapeKey } from './util.js';
import {setDefaultScale} from './scale.js';
import {setDefaultEffect} from './effect-slider.js';
import {sendUserFormDatatoServer} from './api.js';

const FILE_TYPE_OPTIONS = ['jpg', 'jpeg', 'png'];
const MAX_HASHTAG_COUNT = 5;
const COMMENTS_LENGTH = 140;
const imgUploadForm = document.querySelector('.img-upload__form');
const fileUploadControl = imgUploadForm.querySelector('#upload-file');
const uploadCancelButton = imgUploadForm.querySelector('#upload-cancel');
const inputHashTag = imgUploadForm.querySelector('.text__hashtags');
const inputTextDescription = imgUploadForm.querySelector('.text__description');
const submitButton = imgUploadForm.querySelector('.img-upload__submit');
const photoPrewiev = imgUploadForm.querySelector ('.img-upload__preview img');

const successTemplate = document.querySelector('#success').content.querySelector('.success');
const errorTemplate = document.querySelector('#error').content.querySelector('.error');

const onDocumentKeydown = (evt) => {
  if (isEscapeKey(evt)) {
    const errorElement = document.querySelector('.error__inner');
    if (errorElement !== null) {
      closeResultElement(errorElement);
    } else if(document.activeElement !== inputHashTag && document.activeElement !== inputTextDescription){
      evt.preventDefault();

      closeUserForm();
    }
  }
};

const uploadPhoto = () => {
  const file = fileUploadControl.files[0];
  const fileName = file.name.toLowerCase();

  const matches = FILE_TYPE_OPTIONS.some((type) => fileName.endsWith(type));
  if (matches) {
    photoPrewiev.src = URL.createObjectURL(file);
  }
};

fileUploadControl.addEventListener('change', ()=>{
  imgUploadForm.querySelector('.img-upload__overlay').classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.addEventListener('keydown', onDocumentKeydown);
  setDefaultScale();
  setDefaultEffect();
  submitButton.disabled = false;
  imgUploadForm.querySelector('#effect-none').checked = true;
  uploadPhoto();

});


function closeUserForm () {
  imgUploadForm.querySelector('.img-upload__overlay').classList.add('hidden');
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', onDocumentKeydown);
  fileUploadControl.value = '';
  inputHashTag.value = '';
  inputTextDescription.value = '';
}


uploadCancelButton.addEventListener('click', ()=> {
  closeUserForm();
});

const pristine = new Pristine(imgUploadForm, {
  classTo: 'img-upload__field-wrapper',
  errorTextParent: 'img-upload__field-wrapper',
  errorTextTag: 'div',
  errorTextClass: 'img-upload__field-wrapper__error',
});

const isHashTagValid = (hashTag) => {
  const hashTagRegEx = /^#[a-zа-яё0-9]{1,19}$/i;
  return hashTagRegEx.test(hashTag);
};

const validateHashTag = (value) => {
  if (value === '') {
    return true;
  }
  const hashtagsArray = value.split(' ').filter((tag) => tag !== '');
  const newHashTagGroups = [];
  for (let i = 0; i < hashtagsArray.length; i++) {
    if (!isHashTagValid(hashtagsArray[i])) {
      return false;
    }
    if(newHashTagGroups.includes(hashtagsArray[i].toLowerCase())){
      return false;
    } else {
      newHashTagGroups.push(hashtagsArray[i]);
    }
    if (hashtagsArray.length > MAX_HASHTAG_COUNT) {
      return false;
    }
  }
  return true;

};


pristine.addValidator(
  imgUploadForm.querySelector('.text__hashtags'),
  validateHashTag,
  'Ошибка заполнения ХэшТега'
);


const validateCommentsField = (value) => value.length <= COMMENTS_LENGTH;

pristine.addValidator(
  imgUploadForm.querySelector('.text__description'),
  validateCommentsField,
  `Не более ${ COMMENTS_LENGTH } символов`
);

const onDocumentKeydownEscForResultElement = (evt,resultElement) => {
  if (isEscapeKey(evt)) {
    evt.preventDefault();
    closeResultElement(resultElement);
  }
};

const onDocumentClickOutsideResultElement = (evt,resultElement) =>{
  if (!resultElement.querySelector('div').contains(evt.target)) {
    closeResultElement(resultElement);
  }
};

function closeResultElement (resultElement) {
  resultElement.remove();
  submitButton.disabled = false;
  document.removeEventListener('keydown', onDocumentKeydownEscForResultElement);
  document.removeEventListener('click', onDocumentClickOutsideResultElement);
}

const openResultElement = (template) => {
  const resultElement = template.cloneNode(true);
  document.body.insertAdjacentElement('beforeend', resultElement);
  document.addEventListener('keydown', (evt) => {
    onDocumentKeydownEscForResultElement (evt,resultElement);
  });
  document.addEventListener('click', (evt) => {
    onDocumentClickOutsideResultElement(evt,resultElement);
  });

  const closeButton = resultElement.querySelector('button');
  closeButton.addEventListener('click', ()=>{
    closeResultElement(resultElement);
  });
};

const setUserFormSubmit = (onSuccess) => {
  imgUploadForm.addEventListener('submit', (evt)=>{
    evt.preventDefault();
    const isValid = pristine.validate();
    if (isValid) {
      const formData = new FormData(evt.target);
      sendUserFormDatatoServer(formData,onSuccess,successTemplate,errorTemplate);
      submitButton.disabled = true;
    }
  });
};

export {setUserFormSubmit, closeUserForm, openResultElement};

