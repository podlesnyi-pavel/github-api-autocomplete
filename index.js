'use strict';

class HttpError extends Error {
  constructor(message, errorData) {
    super(message);
    this.errorData = errorData;
    this.name = 'HttpError';
  }
}

const baseUrl = 'https://api.github.com/search/repositories?q=';

const form = document.querySelector('.api-github-form');
const search = form.querySelector('.api-github-form__search');
const dropdown = form.querySelector('.api-github-form__dropdown');
const repos = form.querySelector('.api-github-form__repos');

let timer;
let currentData;
let currentRepos = [];

search.addEventListener('input', (event) => {
  clearInterval(timer);
  timer = null;

  const query = event.target.value;

  if (query) {
    timer = setTimeout(() => {
      return getRepositories(query)
        .then((data) => {
          currentData = data.items.slice(0, 5);

          const dropdownlList = currentData.map(
            ({ id, full_name }, index) =>
              `<div class="api-github-form__dropdown-item" data-id="${id}" data-index="${index}">${full_name}</div>`
          );

          dropdown.innerHTML = dropdownlList.join('');
          changeDisplay(dropdown, false);
        })
        .catch((error) => console.error(error, error.errorData));
    }, 1000);
  } else {
    resetDropdown();
    resetCurrentData();
  }
});

dropdown.addEventListener('click', (event) => {
  const reposItem = addReposItem(event.target);

  if (!reposItem) return;

  repos.insertAdjacentHTML('afterbegin', reposItem);

  changeDisplay(repos, false);
  resetCurrentData();
  resetDropdown();
  search.value = '';
});

repos.addEventListener('click', (event) => {
  removeReposItem(event.target);

  if (!currentRepos.length) changeDisplay(repos, true);
});

function changeDisplay(elem, bool) {
  console.log('elem', elem);
  console.log('bool', bool);

  if (elem.hidden === bool) return;
  elem.hidden = bool;
}

function resetCurrentData() {
  currentData = undefined;
}

function resetDropdown() {
  changeDisplay(dropdown, true);
  dropdown.innerHTML = '';
}

async function getRepositories(query) {
  const response = await fetch(`${baseUrl}${query}`, {
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    return await response.json();
  }

  const errorData = await response.json();
  throw new HttpError(`Error in request ${baseUrl}${query}`, errorData);
}

function addReposItem(target) {
  const id = target.dataset.id;

  if (!target.closest('.api-github-form__dropdown-item')) return;
  if (currentRepos.some((repository) => repository.id === Number(id))) return;

  const index = target.dataset.index;
  currentRepos.push(currentData[index]);
  const {
    name,
    owner: { login },
    stargazers_count,
  } = currentData[index];

  return `
    <div class="api-github-form__repos-item" data-id="${id}">
      <div class="api-github-form__repos-name">Name: ${name}</div>
      <div class="api-github-form__repos-owner">Owner: ${login}</div>
      <div class="api-github-form__repos-stars">Stars: ${stargazers_count}</div>
      <button class="api-github-form__repos-close"></button>
    </div>
  `;
}

function removeReposItem(target) {
  if (!target.closest('.api-github-form__repos-close')) return;

  const reposItem = target.closest('.api-github-form__repos-item');

  if (reposItem) {
    currentRepos = currentRepos.filter(
      (repository) => repository.id !== Number(reposItem.dataset.id)
    );

    reposItem.remove();
  }
}
