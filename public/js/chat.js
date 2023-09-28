const socket = io()

const $messageForm = document.querySelector('#formData')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocation = document.querySelector('#sendLocation')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const urlTemplate = document.querySelector('#url-template').innerHTML
//const sidebarTemplate = document.querySelector('#sidebar-template')

//options
const { username, room }= Qs.parse(location.search, { ignoreQueryPrefix : true})

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new messages
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop +visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (str)=> {
    console.log(str)
    const html = Mustache.render(messageTemplate,{
        username : str.username,
        message : str.text,
        createdAt : moment(str.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})
socket.on('locationMessage', (map)=> {
    const html = Mustache.render(urlTemplate,{
        username : map.username,
        link : map.url,
        createdAt : moment(map.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData', ({room, users})=> {
    const sidebarTemplate = `
        <h2 class="room-title">{{room}}</h2>
        <h3 class="list-title">Users</h3>
        <ul class="users">
            {{#users}}
                <li>{{username}}</li>
            {{/users}}
        </ul>
    `;
    const html = Mustache.render(sidebarTemplate, {
        room,
        users : users
    })
    document.querySelector('#sidebar').innerHTML = html 
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const message = e.target.elements.message.value

    $messageFormButton.setAttribute('disabled','disabled')

    socket.emit('sendMessage',message, (err )=> {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value =""
        $messageFormInput.focus()
        if(err){
            return console.log(err)
        }
        console.log('message is delived ', err)
    })
})



$sendLocation.addEventListener('click', () =>{

    $sendLocation.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        socket.emit('send-location', {
            lat : position.coords.latitude,
            long : position.coords.longitude
        }, ()=>{
            console.log('Location Shared')
            $sendLocation.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username,room} , (error = null) => {
    if(error){
        alert(error)
        location.href = '/'
    }
    
} )