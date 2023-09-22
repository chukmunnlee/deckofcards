package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func mkVersion(gitCommit string) func(*gin.Context) {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK,
			gin.H{"version": gitCommit, "timestamp": time.Now().Unix()},
		)
	}
}
