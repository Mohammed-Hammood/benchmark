package main

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ==========================================
// GLOBAL CONFIGURATION (100 records)
// ==========================================
type NameGender struct {
	Name   string `json:"name"`
	Gender string `json:"gender"`
}

var NameGenderPool = []NameGender{
	{"James", "M"}, {"John", "M"}, {"Robert", "M"}, {"Michael", "M"}, {"William", "M"}, {"David", "M"}, {"Richard", "M"}, {"Joseph", "M"}, {"Thomas", "M"}, {"Charles", "M"}, {"Christopher", "M"}, {"Daniel", "M"}, {"Matthew", "M"}, {"Anthony", "M"}, {"Mark", "M"}, {"Donald", "M"}, {"Steven", "M"}, {"Paul", "M"}, {"Andrew", "M"}, {"Joshua", "M"}, {"Kenneth", "M"}, {"Kevin", "M"}, {"Brian", "M"}, {"George", "M"}, {"Timothy", "M"}, {"Ronald", "M"}, {"Edward", "M"}, {"Jason", "M"}, {"Jeffrey", "M"}, {"Ryan", "M"}, {"Jacob", "M"}, {"Gary", "M"}, {"Nicholas", "M"}, {"Eric", "M"}, {"Jonathan", "M"}, {"Stephen", "M"}, {"Larry", "M"}, {"Justin", "M"}, {"Scott", "M"}, {"Brandon", "M"}, {"Benjamin", "M"}, {"Samuel", "M"}, {"Raymond", "M"}, {"Gregory", "M"}, {"Frank", "M"}, {"Alexander", "M"}, {"Patrick", "M"}, {"Jack", "M"}, {"Dennis", "M"}, {"Jerry", "M"},
	{"Mary", "F"}, {"Patricia", "F"}, {"Jennifer", "F"}, {"Linda", "F"}, {"Barbara", "F"}, {"Elizabeth", "F"}, {"Susan", "F"}, {"Jessica", "F"}, {"Sarah", "F"}, {"Karen", "F"}, {"Lisa", "F"}, {"Nancy", "F"}, {"Betty", "F"}, {"Margaret", "F"}, {"Sandra", "F"}, {"Ashley", "F"}, {"Dorothy", "F"}, {"Kimberly", "F"}, {"Emily", "F"}, {"Donna", "F"}, {"Michelle", "F"}, {"Carol", "F"}, {"Amanda", "F"}, {"Melissa", "F"}, {"Deborah", "F"}, {"Stephanie", "F"}, {"Rebecca", "F"}, {"Sharon", "F"}, {"Laura", "F"}, {"Cynthia", "F"}, {"Kathleen", "F"}, {"Amy", "F"}, {"Angela", "F"}, {"Shirley", "F"}, {"Anna", "F"}, {"Brenda", "F"}, {"Pamela", "F"}, {"Emma", "F"}, {"Nicole", "F"}, {"Helen", "F"}, {"Samantha", "F"}, {"Katherine", "F"}, {"Christine", "F"}, {"Debra", "F"}, {"Rachel", "F"}, {"Carolyn", "F"}, {"Janet", "F"}, {"Catherine", "F"}, {"Maria", "F"}, {"Heather", "F"},
}

type User struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Gender string `json:"gender"`
	Age    int    `json:"age"`
}

// ==========================================
// 1. MATH CALCULATION ENDPOINT
// ==========================================
func runMathCalculation(c *gin.Context) {
	nStr := c.Query("n")
	n, err := strconv.ParseInt(nStr, 10, 64)

	// Validation: 1000 <= n <= 1,000,000,000
	if err != nil || n < 1000 || n > 1000_000_000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"detail": "n must be between 1,000 and 1,000,000,000",
		})
		return
	}

	startTime := time.Now()
	var totalSum int64 = 0

	for i := int64(0); i < n; i++ {
		if i%2 == 0 {
			totalSum += 1
		} else {
			totalSum += i % 10
		}
		// rand.Intn(1000) gives 0-999, so we add 1 to get 1-1000
		totalSum += int64(rand.Intn(1000) + 1)
	}

	elapsed := time.Since(startTime)
	elapsedMs := float64(elapsed.Nanoseconds()) / 1e6

	c.JSON(http.StatusOK, gin.H{
		"status":            "success",
		"test_type":         "math_calculation",
		"n":                 n,
		"result":            totalSum,
		"execution_time_ms": math.Round(elapsedMs*100) / 100,
	})
}

// ==========================================
// 2. DATA GENERATION ENDPOINT
// ==========================================
func generateUserData(c *gin.Context) {
	nStr := c.Query("n")
	n, err := strconv.Atoi(nStr)

	// Validation: 1000 <= n <= 1,000,000
	if err != nil || n < 1000 || n > 1000000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"detail": "n must be between 1,000 and 1,000,000",
		})
		return
	}

	startTime := time.Now()

	// Ensure output directory exists
	err = os.MkdirAll("generated_data", os.ModePerm)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}

	filename := fmt.Sprintf("users_%d.json", n)
	filePath := filepath.Join("generated_data", filename)

	poolSize := len(NameGenderPool)

	// Pre-allocate the slice for memory efficiency
	users := make([]User, n)
	for i := 0; i < n; i++ {
		chosenPair := NameGenderPool[rand.Intn(poolSize)]
		users[i] = User{
			ID:     i + 1,
			Name:   chosenPair.Name,
			Gender: chosenPair.Gender,
			Age:    rand.Intn(76) + 15, // 15 to 90 inclusive
		}
	}

	// Marshal to JSON
	data, err := json.Marshal(users)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}

	// Save to file
	err = os.WriteFile(filePath, data, 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}

	elapsed := time.Since(startTime)
	elapsedMs := float64(elapsed.Nanoseconds()) / 1e6

	c.JSON(http.StatusOK, gin.H{
		"status":            "success",
		"test_type":         "data_generation",
		"n":                 n,
		"file_saved":        filename,
		"execution_time_ms": math.Round(elapsedMs*100) / 100,
	})
}

// ==========================================
// MAIN EXECUTION
// ==========================================
func main() {
	r := gin.Default()

	r.GET("/api/math", runMathCalculation)
	r.GET("/api/generate", generateUserData)

	// run on port 8081 so we can run Python (8080) and Go (8081) simultaneously
	r.Run(":8081")
}
