// This is the JavaScript entry file - your code begins here
// Do not delete or rename this file ********
import './css/base.scss';
//import User from './User';
import Manager from './Manager';
import Customer from './Customer';
import Room from './Room';
import RoomsRepo from './RoomsRepo';
import Booking from './Booking';
import BookingsRepo from './BookingsRepo';
import apiCalls from './apiCalls';
import domUpdate from './domUpdate';

// An example of how you tell webpack to use an image (also need to link to it in the index.html)
// import './images/turing-logo.png'

//Gloabel Variable
const todayDate = '2020/02/12';
let currentUser, customers, rooms, bookings, roomsRepo, bookingsRepo;

//Query Selector
const loginInputs = document.querySelectorAll('.login-input');
const loginData = Array.from(loginInputs); 
const loginBtn = document.querySelector('#register-btn');
const loginPage = document.querySelector('.login-page');
const mainPage = document.querySelector('.main-page');
const dashboardRightSide = document.querySelector('.right-side');
const todayDataSection = document.querySelector('.today-data');
const listRoomsSection = document.querySelector('.list-rooms');
const calendarInput = document.querySelector('#calendar-input');
const selectDateBtn = document.querySelector('.select-date-btn');
const displayRooms = document.querySelector('.display-rooms');
const guestSearchBtn = document.querySelector('.search-customer-btn');
const guestSearchInput = document.querySelector('#guest');
const displayGuestDataSection = document.querySelector('.display-guest-data');

//event listener
loginBtn.addEventListener('click', checkLoginInputs);
selectDateBtn.addEventListener('click', displayAvailableRooms);
guestSearchBtn.addEventListener('click', displayGuestInfo);

//function

Promise.all([apiCalls.getUserData(), apiCalls.getRoomData(), apiCalls.getBookingData()])
  .then(data => {
    const allData = data.reduce((dataSet, eachDataset) => {      
      return dataSet = {...dataSet, ...eachDataset}
    }, {})
    instanciatate(allData);
    currentUser = new Manager('Elle')
    displayManagerPage();
  })

function instanciatate(dataSet) {
  customers = dataSet.users.map(user => new Customer(user.id, user.name));
  rooms = dataSet.rooms.map(room => new Room(room.number, room.roomType, room.bidet, room.bedSize, room.numBeds, room.costPerNight));
  roomsRepo = new RoomsRepo(rooms);
  bookings = dataSet.bookings.map(booking => new Booking(booking.id, booking.userID, booking.date, booking.roomNumber, booking.roomServiceCharges));
  bookingsRepo = new BookingsRepo(bookings);
}

function checkLoginInputs() {
  if (!areInputsFilled() && checkUsername() && checkPassword()) {
    displayPage();
  }
}

function areInputsFilled() {
  return loginData.find(input => input.value === '');
}

function checkUsername() {
  const splitInput = loginData[0].value.split('customer'); 
  if (splitInput[0] === 'manager') {
    currentUser = new Manager('Elle');
    return true;
  } else if (splitInput[0] === '' && splitInput[1] < 51) {
    const id = parseInt(splitInput[1]).toFixed(0);
    currentUser = updateCurrentCustomer(id);
    return true;
  } else {
    return false
  }
}

function updateCurrentCustomer(id) {
  id = parseInt(id);
  return customers.find(customer => customer.id === id);
}

function checkPassword() {
  return loginData[1].value === 'overlook2020';
}

function updateElement(elements) {
  elements.forEach(element => {
    if(element.addHidden) {
      element.section.classList.add('hidden')
    } else if (element.addHide) {
      element.section.classList.add('hide')
    } else {
      element.section.classList.remove('hidden', 'hide')
    }
  });
}

function displayPage() {
  if (currentUser instanceof Manager) {
    displayManagerPage();
  } else if (currentUser instanceof Customer) {
    displayCustomerPage();
  }
  updateWelcome();
}

/////////////////////////Manager site below///////////////////////////
function displayManagerPage() { 
  const sections = [{section: loginPage, addHidden: true}, {section: mainPage}];
  updateElement(sections);
  displayManagerTodayData();
}

function displayManagerTodayData() {
  const bookedRooms = bookingsRepo.returnBookedRoomsNum('date', todayDate);
  const openRooms = roomsRepo.returnAvailableRooms(bookedRooms);
  const revenue = currentUser.returnTodayRevenue(todayDate, bookings, rooms);
  domUpdate.updateManagerTodayData(todayDataSection, (openRooms.length), revenue, ((bookedRooms.length)/25));
}

function displayAvailableRooms() {  
  const selectDate = calendarInput.value.split('-').join('/');
  const bookedRooms = bookingsRepo.returnBookedRoomsNum('date', selectDate);
  const openRooms = roomsRepo.returnAvailableRooms(bookedRooms);
  const types = returnAllRoomTypes();
  domUpdate.updateAvailableRooms(listRoomsSection, openRooms, types);
  updateElement([{section: listRoomsSection}]);
}

function returnAllRoomTypes() {
  return rooms.reduce((types, room) => {
    if (!types.includes(room.roomType)) {
      types.push(room.roomType);
    }
    return types
  }, [])
}

function returnGuestInfo() {
  return customers.find(customer => customer.name === guestSearchInput.value)
}

function displayGuestInfo() {
  const customer = returnGuestInfo();
  if (customer) {
    const bookings = bookingsRepo.filterBookingsByRef('userID', customer.id);
    const totalCost = customer.returnUserRevenue(customer.id, bookings, rooms) 
    domUpdate.updateGuestInfo(displayGuestDataSection, bookings, totalCost)
    updateElement([{section: displayGuestDataSection}]);
  } else {
    updateElement([{section: displayGuestDataSection, addHidden: true}]);
  }
}

/////////////////////////Manager site above///////////////////////////

function displayCustomerPage() {
  const sections = [{section: loginPage, addHidden: true}, {section: mainPage}, {section: dashboardRightSide, addHide: true}];
  updateElement(sections);
  updateCustomerPage();
}

function updateWelcome() {
  const welcome = document.querySelector('h2');
  welcome.innerText = `Welcome back ${currentUser.name}`;
}
//hard code in
function updateCustomerPage() {
  todayDataSection.innerHTML = '';
  todayDataSection.innerHTML += 
  `
  <h3 class="guest guest-booking">Booking History</h3>
  <p>2020/03/02 room 2</p>
  <h3 class="guest guest-cost">Total Cost: $2000</h3>
  `
}