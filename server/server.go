package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type MoveMessage struct {
	Move string `json:"move"`
}

var (
	clients   = make(map[*websocket.Conn]string) // conn → id
	positions = make(map[string]Position)        // id → pos
	mu        sync.Mutex
	upgrader  = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

func randomID() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

func movePosition(pos Position, dir string) Position {
	switch dir {
	case "w":
		pos.Y -= 10
	case "a":
		pos.X -= 10
	case "s":
		pos.Y += 10
	case "d":
		pos.X += 10
	}
	return pos
}

func handleConn(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	id := randomID()
	mu.Lock()
	clients[conn] = id
	positions[id] = Position{X: rand.Intn(800), Y: rand.Intn(600)}
	mu.Unlock()

	log.Println("New client:", id)

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			break
		}

		var m MoveMessage
		if err := json.Unmarshal(msg, &m); err != nil {
			log.Println("Bad message:", err)
			continue
		}

		// Update position
		mu.Lock()
		pos := positions[id]
		positions[id] = movePosition(pos, m.Move)

		// Prepare response: list of all positions (no IDs)
		var response []Position
		for _, p := range positions {
			response = append(response, p)
		}
		mu.Unlock()

		// Broadcast to all clients
		respBytes, _ := json.Marshal(response)
		mu.Lock()
		for c := range clients {
			if err := c.WriteMessage(websocket.TextMessage, respBytes); err != nil {
				log.Println("Write error:", err)
			}
		}
		mu.Unlock()
	}

	// Cleanup
	mu.Lock()
	log.Println("Client disconnected:", id)
	delete(positions, id)
	delete(clients, conn)
	mu.Unlock()
}

func main() {
	http.HandleFunc("/ws", handleConn)
	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
