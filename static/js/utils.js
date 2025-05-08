// export function createElement(tag, className = '', text = '') {
//     const el = document.createElement(tag);
//     if (className) el.className = className;
//     if (text) el.textContent = text;
//     return el;
//   }
  
//   import { createElement } from '../domHelpers.js';
  
//   export function renderList(items, containerId) {
//     const container = document.getElementById(containerId);
//     container.innerHTML = ''; // Clear previous content
  
//     items.forEach(item => {
//       const li = createElement('li', 'list-item', item);
//       container.appendChild(li);
//     });
//   }
  
//   import { renderList } from './ui/renderList.js';
//   import { getItems } from './data/fetchData.js';
  
//   document.addEventListener('DOMContentLoaded', async () => {
//     const items = await getItems();
//     renderList(items, 'listContainer');
//   });
  
//   // ui/eventHandlers.js
//   export function attachClickHandler(containerId, callback) {
//     const container = document.getElementById(containerId);
//     container.addEventListener('click', e => {
//       if (e.target.matches('.list-item')) {
//         callback(e.target.textContent);
//       }
//     });
//   }