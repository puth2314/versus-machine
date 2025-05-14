package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/a-h/templ"
	"github.com/puth2314/versus-machine/templates"
)

type GameState struct {
	Turn   string       `json:"turn"`
	Board  [3][3]string `json:"board"`
	Winner string       `json:"winner,omitempty"`
	Draw   bool         `json:"draw,omitempty"`
}

type GameService struct {
	state *GameState
	mu    sync.Mutex
}

func NewGameService() *GameService {
	return &GameService{
		state: &GameState{
			Turn:  "X",
			Board: [3][3]string{},
		},
	}
}

func (gs *GameService) ApplyAction(player string, row int, col int) error {
	gs.mu.Lock()
	defer gs.mu.Unlock()

	if gs.state.Winner != "" || gs.state.Draw {
		return errors.New("game is over, please reset")
	}

	if player != gs.state.Turn {
		log.Printf("Invalid move: it's %s's turn, not %s", gs.state.Turn, player)
		return errors.New("not your turn")
	}
	if row < 0 || row >= 3 || col < 0 || col >= 3 {
		log.Printf("Invalid move: row=%d, col=%d out of bounds", row, col)
		return errors.New("invalid position")
	}
	if gs.state.Board[row][col] != "" {
		log.Printf("Invalid move: cell (%d,%d) already occupied", row, col)
		return errors.New("cell already occupied")
	}

	gs.state.Board[row][col] = player
	log.Printf("Player %s moved to (%d, %d)", player, row, col)

	if gs.checkWin(player, 3) {
		gs.state.Winner = player
		log.Printf("Player %s wins!", player)
		return nil
	}

	if gs.isBoardFull() {
		gs.state.Draw = true
		log.Println("Game is a draw!")
		return nil
	}

	if player == "X" {
		gs.state.Turn = "O"
	} else {
		gs.state.Turn = "X"
	}
	return nil
}

func (gs *GameService) checkWin(player string, winLength int) bool {
	b := gs.state.Board

	rows := len(b)
	if rows == 0 {
		return false
	}
	cols := len(b[0])

	directions := [][]int{
		{0, 1},  // right
		{1, 0},  // down
		{1, 1},  // down-right
		{1, -1}, // down-left
	}

	for row := 0; row < rows; row++ {
		for col := 0; col < cols; col++ {
			if b[row][col] != player {
				continue
			}
			for _, dir := range directions {
				count := 1
				for k := 1; k < winLength; k++ {
					r := row + dir[0]*k
					c := col + dir[1]*k
					if r < 0 || r >= rows || c < 0 || c >= cols || b[r][c] != player {
						break
					}
					count++
				}
				if count == winLength {
					return true
				}
			}
		}
	}
	return false
}

func (gs *GameService) isBoardFull() bool {
	for _, row := range gs.state.Board {
		for _, cell := range row {
			if cell == "" {
				return false
			}
		}
	}
	return true
}

func (gs *GameService) ResetGame() {
	gs.mu.Lock()
	defer gs.mu.Unlock()

	gs.state.Turn = "X"
	gs.state.Board = [3][3]string{}
	gs.state.Winner = ""
	gs.state.Draw = false
}

type GameHandler struct {
	service *GameService
}

func NewGameHandler(service *GameService) *GameHandler {
	return &GameHandler{service: service}
}

func (h *GameHandler) respondWithGameState(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(h.service.state)
	if err != nil {
		http.Error(w, "Failed to encode game state", http.StatusInternalServerError)
	}
}

type MoveRequest struct {
	Player string `json:"player"`
	Row    int    `json:"row"`
	Col    int    `json:"col"`
}

func (h *GameHandler) processPlayerAction(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		http.Error(w, "Content-Type must be application/json", http.StatusUnsupportedMediaType)
		return
	}

	var move MoveRequest
	err := json.NewDecoder(r.Body).Decode(&move)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err = h.service.ApplyAction(move.Player, move.Row, move.Col)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	h.respondWithGameState(w, r)
}

func (h *GameHandler) resetGame(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	h.service.ResetGame()
	h.respondWithGameState(w, r)
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func main() {
	mux := http.NewServeMux()
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	// mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
	// 	templates.GamePage().Render(r.Context(), w)
	// })
	mux.Handle("/", templ.Handler(templates.Layout("Home")))
	mux.HandleFunc("/time", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte("<div>The current time is: " + time.Now().Format(time.RFC1123) + "</div>"))
	})

	gameService := NewGameService()
	gameHandler := NewGameHandler(gameService)

	mux.HandleFunc("/state", gameHandler.respondWithGameState)
	mux.HandleFunc("/action", gameHandler.processPlayerAction)
	mux.HandleFunc("/reset", gameHandler.resetGame)

	log.Println("Starting server on port 8080...")
	err := http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
