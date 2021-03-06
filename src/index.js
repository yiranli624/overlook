import './css/base.scss';
import Manager from './Manager';
import Customer from './Customer';
import Room from './Room';
import RoomsRepo from './RoomsRepo';
import Booking from './Booking';
import BookingsRepo from './BookingsRepo';
import apiCalls from './apiCalls';
import domUpdate from './domUpdate';
import './images/user-icon.png'

let today, selectDate, currentCustomer, currentUser;
let customers, rooms, bookings, roomsRepo, bookingsRepo; 
let newBooking = {userID: 1, date: '', roomNumber: 1};

const loginInputs = document.querySelectorAll('.login-input');
const loginData = Array.from(loginInputs); 
const loginBtn = document.querySelector('#register-btn');
const loginPage = document.querySelector('.login-page');
const mainPage = document.querySelector('.main-page');
const logOutBtn = document.querySelector('#log-out');
const listRoomsSection = document.querySelector('.list-rooms');
const selectDateBtn = document.querySelector('.select-date-btn');
const displayRoomsSection = document.querySelector('.display-rooms');
const guestSearchBtn = document.querySelector('.search-customer-btn');
const guestSection = document.querySelector('.guest-data');
const displayGuestDataSection = document.querySelector('.display-guest-data');
const bookBtn = document.querySelector('.book-btn');
const deleteBookingInputs = document.querySelectorAll('.delete-input input');
const deleteBookingBtn = document.querySelector('.delete-booking-btn');
const messageSection = document.querySelectorAll('.message');

loginBtn.addEventListener('click', checkLoginInputs);
logOutBtn.addEventListener('click', logOut);
selectDateBtn.addEventListener('click', displayAvailableRooms);
guestSearchBtn.addEventListener('click', displayGuestInfo);
listRoomsSection.addEventListener('change', displayFilterRooms);
displayRoomsSection.addEventListener('click', selectARoom);
bookBtn.addEventListener('click', makeBooking);
deleteBookingBtn.addEventListener('click', deleteBooking);

Promise.all([apiCalls.getUserData(), apiCalls.getRoomData(), apiCalls.getBookingData()])
  .then(data => {
    const allData = data.reduce((dataSet, eachDataset) => {      
      return dataSet = {...dataSet, ...eachDataset}
    }, {});
    instanciatate(allData);
    updateTodayDate();
  })

function instanciatate(dataSet) {
  customers = dataSet.users.map(user => new Customer(user.id, user.name));
  rooms = dataSet.rooms.map(room => new Room(room.number, room.roomType, room.bidet, room.bedSize, room.numBeds, room.costPerNight));
  roomsRepo = new RoomsRepo(rooms);
  bookings = dataSet.bookings.map(booking => new Booking(booking.id, booking.userID, booking.date, booking.roomNumber, booking.roomServiceCharges));
  bookingsRepo = new BookingsRepo(bookings);
}

function updateTodayDate() {
  const year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  let date = new Date().getDate();
  month = month < 10 ? `0${month}` : month
  date = date < 10 ? `0${date}` : date
  today = `${year}/${month}/${date}`;
}

function checkLoginInputs() {
  const wrongLogin = document.querySelector('.wrong-login-msg');
  event.preventDefault();
  if (!areInputsFilled() && checkUsername() && checkPassword()) {
    displayPage();
    domUpdate.updateElement([{section: wrongLogin, addHidden: true}]);
    domUpdate.eraseLoginInputs(loginData);
  } else if (!checkUsername() || !checkPassword() || areInputsFilled()) {
    domUpdate.updateElement([{section: wrongLogin}]);
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

function logOut() {
  location.reload();
}

function updateCurrentCustomer(id) {
  id = parseInt(id);
  return customers.find(customer => customer.id === id);
}

function checkPassword() {
  return loginData[1].value === 'overlook2020';
}

function displayPage() {
  if (currentUser instanceof Manager) {
    displayManagerPage();
  } else if (currentUser instanceof Customer) {
    displayCustomerPage();
  }
  updateWelcome();
}

function displayManagerPage() { 
  const sections = [
    {section: loginPage, addHidden: true}, 
    {section: mainPage}, 
    {section: guestSection}
  ];
  domUpdate.updateElement(sections);
  displayManagerTodayData();
}

function displayManagerTodayData() {
  const todayDataSection = document.querySelector('.today-data');
  const bookedRooms = bookingsRepo.returnBookedRoomsNum('date', today);
  const openRooms = roomsRepo.returnAvailableRooms(bookedRooms);
  const revenue = currentUser.returnTodayRevenue(today, bookings, rooms);
  domUpdate.updateManagerTodayData(todayDataSection, (openRooms.length), revenue, ((bookedRooms.length) / 25));
}

function displayAvailableRooms() {  
  const calendarInput = document.querySelector('#calendar-input');
  event.preventDefault();
  selectDate = calendarInput.value.replaceAll('-', '/');
  if (!selectDate || selectDate < today) {
    displayMessage(0, 'error');
    domUpdate.updateElement([{section: listRoomsSection, addHidden: true}]);
  } else if (!currentCustomer && currentUser instanceof Manager) {
    displayMessage(0, 'error');
    domUpdate.updateElement([{section: listRoomsSection, addHidden: true}]);
  } else {
    updateAvailableRooms();
    displayFilterTypes();
    domUpdate.updateElement([{section: listRoomsSection}, {section: messageSection[0], addHidden: true}]);
  }
}

function updateAvailableRooms() {
  const bookedRooms = bookingsRepo.returnBookedRoomsNum('date', selectDate);
  const openRooms = roomsRepo.returnAvailableRooms(bookedRooms);
  domUpdate.updateAvailableRooms(displayRoomsSection, openRooms);
}

function displayFilterTypes() {
  const listTypes = document.querySelector('.list-types');
  const types = returnAllRoomTypes();
  domUpdate.displayTypes(listTypes, types);
}

function displayMessage(num, type) {
  domUpdate.updateElement([{section: messageSection[num]}]);
  domUpdate.displayMessage({section: messageSection[num], [type]: true});
}

function returnAllRoomTypes() {
  return rooms.reduce((types, room) => {
    if (!types.includes(room.roomType)) {
      types.push(room.roomType);
    }
    return types
  }, [])
}

function displayFilterRooms() {
  const filterRooms = filterAvailableRooms();
  if (filterRooms.length !== 0) {
    domUpdate.updateElement([{section: messageSection[1], addHidden: true}]);
    domUpdate.updateAvailableRooms(displayRoomsSection, filterRooms);
  } else {
    domUpdate.updateElement([{section: displayRoomsSection, addHidden: true}])
    displayMessage(1, 'applogy');
  }
}

function filterAvailableRooms() {
  const type = event.target.value;
  const bookedRooms = bookingsRepo.returnBookedRoomsNum('date', selectDate);
  const openRooms = roomsRepo.returnAvailableRooms(bookedRooms);
  return roomsRepo.filterRoomsByType(type, openRooms);
}

function selectARoom() {
  if (event.target.parentNode.id) {
    newBooking.roomNumber = parseInt(event.target.parentNode.id);
  }
}

function makeBooking() {
  newBooking.date = selectDate;
  if (currentCustomer) {
    addBooking(currentCustomer);
  } else if (currentUser instanceof Customer) {
    addBooking(currentUser);
  } 
}

function addBooking(selectUser) {
  newBooking.userID = selectUser.id;
  apiCalls.addBookingData(newBooking)
    .then((data) => {
      bookingsRepo.bookings.push(new Booking(data.id, data.userID, data.date, data.roomNumber));
      selectUser === currentCustomer ? updateGuestInfo() : updateCustomerPage();
      updateAvailableRooms();
    })
}

function returnGuestInfo() {
  const guestSearchInput = document.querySelector('#guest-name');
  return customers.find(customer => customer.name === guestSearchInput.value)
}

function displayGuestInfo() {
  event.preventDefault();
  currentCustomer = returnGuestInfo();   
  if (currentCustomer) {
    updateGuestInfo();
    domUpdate.updateElement([{section: displayGuestDataSection}]);
  } else {
    domUpdate.updateElement([{section: displayGuestDataSection, addHidden: true}]);
  }
}

function updateGuestInfo() {
  const bookings = bookingsRepo.filterBookingsByRef('userID', currentCustomer.id);
  const totalCost = currentCustomer.returnUserRevenue(currentCustomer.id, bookings, rooms);
  bookings.sort((a, b) => a.date < b.date ? -1 : 1); 
  domUpdate.updateGuestInfo(displayGuestDataSection, bookings, totalCost);
}

function deleteBooking() {
  const inquery = checkDeleteBookingInputs();
  if (inquery && currentCustomer && selectDate >= today) {
    domUpdate.updateElement([{section: messageSection[2], addHidden: true}]);
    apiCalls.deleteBookingData({id: inquery.id})
      .then(() => {
        udpateDeleteBooking(inquery.id);
        updateGuestInfo();
      })
  } else {
    displayMessage(2, 'error')
  }
}

function checkDeleteBookingInputs() {
  selectDate = deleteBookingInputs[0].value.replaceAll('-', '/');
  const roomNum = parseInt(deleteBookingInputs[1].value);
  return bookingsRepo.findBooking(selectDate, roomNum);
}

function udpateDeleteBooking(id) {
  deleteBookingInputs[0].value = '';
  deleteBookingInputs[1].value = '';
  bookingsRepo.removeBooking(id)
}

function updateWelcome() {
  const welcome = document.querySelector('.welcome');
  domUpdate.updateWelcomeMsg(welcome, currentUser);
}

function displayCustomerPage() {
  const deleteBookingSection = document.querySelector('.delete-booking');
  const sections = [
    {section: loginPage, addHidden: true}, 
    {section: mainPage}, 
    {section: deleteBookingSection, addHidden: true}
  ];
  domUpdate.updateElement(sections);
  updateCustomerPage();
}

function updateCustomerPage() {
  const bookings = bookingsRepo.filterBookingsByRef('userID', currentUser.id);
  const totalCost = currentUser.returnUserRevenue(currentUser.id, bookings, rooms);
  bookings.sort((a, b) => a.date < b.date ? -1 : 1);
  domUpdate.updateCustomerView(guestSection, bookings, totalCost);
}
