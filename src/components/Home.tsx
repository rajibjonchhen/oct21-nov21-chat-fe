import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, Row, Col, Form, ListGroup, Button, ListGroupItem } from 'react-bootstrap'
import { io } from 'socket.io-client'
import { FormEvent, KeyboardEventHandler, useEffect, useState } from 'react'
import User from '../types/IUser'
import Message from '../types/IMessage'
import { TRoom } from '../types/TRoom'

const ADDRESS = 'http://localhost:3030'
const socket = io(ADDRESS, { transports: ['websocket'] })


const Home = () => {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [room, setRoom]  = useState("")

  useEffect(() => {
    // we need to launch this event listener JUST ONCE!
    // not every time the component re-renders
    socket.on('connect', () => {
      console.log('connection established!')
    })
    // every time you use .on() you're LISTENING for an event emitted on the server

    socket.on('loggedin', () => {
      console.log("You're correctly logged in now")
      setIsLoggedIn(true)
      fetchOnlineUsers()

      socket.on('newConnection', () => {
        // this is for the already connected clients!
        // will never be sent to a user that just logged in
        console.log('Look! another client connected!')
        fetchOnlineUsers()
      })

      socket.on('message', (newMessage: Message) => {
        // setChatHistory([...chatHistory, newMessage])
        // bug?
        setChatHistory((currentChatHistory) => [
          ...currentChatHistory,
          newMessage,
        ])
      })
    })
  }, [])

  const handleUsernameSubmit = (e: FormEvent) => {
    e.preventDefault()
    // we need to send the username to the server
    // the username is safely stored in a 'username' state variable
    // we'll EMIT AN EVENT to the server!
    socket.emit('setUsername', {
      // username: username
      username,
      room
    })
  }

  const fetchOnlineUsers = async () => {
    try {
      let response = await fetch(ADDRESS + '/online-users')
      if (response.ok) {
        let data = await response.json()
        console.log('online users: ', data)
        let users = data.onlineUsers
        setOnlineUsers(users)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleMessageSubmit = (e: FormEvent) => {
    e.preventDefault()

    // a valid message for our platform is made by these properties
    // text
    // sender
    // timestamp
    // id

    const messageToSend: Message = {
      text: message,
      sender: username,
      id: socket.id,
      timestamp: Date.now(),
    }

    socket.emit('sendmessage', {message: messageToSend, room})
    setChatHistory([...chatHistory, messageToSend])
    // [...chatHistory] <-- creates an exact copy of chatHistory
    setMessage('')
  }

  return (
    <Container fluid className='px-4 mt-3'>
      <Row style={{ height: '95vh' }}>
        <Col md={10} className='d-flex flex-column justify-content-between'>
          
          <Form onSubmit={handleUsernameSubmit}>
            <Form.Control
              type='text'
              placeholder='Enter your username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoggedIn}
            />
          </Form>
          {/* MIDDLE SECTION: CHAT HISTORY */}
          <ListGroup>
            {chatHistory.map((message) => (
              <ListGroup.Item key={message.timestamp} className='d-flex'>
               <span style={{ fontWeight:"bolder"}}> {message.sender} : </span> 
               {message.text}
               <span className="ml-auto text-muted" style={{fontSize:"12px", fontWeight:"bolder"}}> {new Date(message.timestamp).toLocaleTimeString()} : </span> 
              </ListGroup.Item>
            ))}
          </ListGroup>
          {/* BOTTOM SECTION: NEW MESSAGE INPUT FIELD */}
          <Form onSubmit={handleMessageSubmit}>
            <Form.Control
              type='text'
              placeholder='Enter your message'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!isLoggedIn}
            />
          </Form>
        </Col>
        <Col md={2}>
          {/* ONLINE USERS COL */}
          <div className='mb-3'>Connected users:</div>
          <ListGroup>
            {onlineUsers
            // .filter(user => user.room === room)
            .map((user) => (
              <ListGroup.Item key={user.id} className={"pointer " +`${room===user.id?'bg-secondary text-white':""}`} onClick={() => setRoom(user.id)}> {user.username}</ListGroup.Item>
            ))}
          </ListGroup>

          <div className='my-3'>Chat Group</div>

          <ListGroup>
            <ListGroup.Item className={"pointer " +`${room==="timepass"? 'bg-secondary text-white':""}`} onClick={() => setRoom("timepass")}>Timepass</ListGroup.Item>
            <ListGroup.Item className={"pointer " +`${room==="project"? 'bg-secondary text-white':""}`}  onClick={() => setRoom("project")}>Project </ListGroup.Item>
            <ListGroup.Item className={"pointer " +`${room==="game"? 'bg-secondary text-white':""}`}  onClick={() => setRoom("game")}>Game </ListGroup.Item>
          </ListGroup>
        </Col>
      </Row>
    </Container>
  )
}

export default Home
