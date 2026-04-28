package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/aarzilli/nucular"
	"github.com/aarzilli/nucular/style"
	"gopkg.in/yaml.v3"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// -------------------- DATA --------------------

type Place struct {
	Name        string            `yaml:"name" json:"name"`
	Description string            `yaml:"description" json:"description"`
	URL         string            `yaml:"url" json:"url"`
	Coord       []float64         `yaml:"coord" json:"coord"`
	BarType     string            `yaml:"type" json:"type"`
	Open        map[string]string `yaml:"open" json:"open"`
}

type Config struct {
	AccessKey string `json:"AWS_ACCESS_KEY"`
	SecretKey string `json:"AWS_SECRET_KEY"`
	Region    string `json:"AWS_REGION"`

	Bucket string `json:"BUCKET"`
	Key    string `json:"KEY"`

	FilesRoot string `json:"FILES"`
}

var (
	cfg      Config
	s3Client *s3.Client
)

// -------------------- INIT --------------------

func loadAppConfig(basePath string) {
	data, err := os.ReadFile(filepath.Join(basePath, "aws.json"))
	if err != nil {
		log.Fatal(err)
	}
	if err := json.Unmarshal(data, &cfg); err != nil {
		log.Fatal(err)
	}

	if cfg.FilesRoot == "" {
		cfg.FilesRoot = filepath.Join(basePath, "places")
	}

	awsCfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, "")),
	)
	if err != nil {
		log.Fatal(err)
	}

	s3Client = s3.NewFromConfig(awsCfg)
}

// -------------------- YAML --------------------

func loadYAMLFiles(basePath string) ([]Place, error) {
	var result []Place

	files, err := filepath.Glob(basePath + "/*.yaml")
	if err != nil {
		return nil, err
	}

	for _, f := range files {
		data, err := os.ReadFile(f)
		if err != nil {
			return nil, err
		}

		var b Place
		if err := yaml.Unmarshal(data, &b); err != nil {
			return nil, err
		}

		if b.Name == "example" {
			log.Println("Skipping example.yaml")
			continue
		}

		result = append(result, b)
	}

	return result, nil
}

func saveYAMLFiles(basePath string, bars []Place) error {
	for _, b := range bars {
		if b.Name == "example" {
			log.Println("Skipping example.yaml")
			continue
		}

		data, err := yaml.Marshal(b)
		if err != nil {
			return err
		}

		filename := filepath.Join(basePath, fmt.Sprintf("%s.yaml", b.Name))
		if err := os.WriteFile(filename, data, 0644); err != nil {
			return err
		}
	}
	return nil
}

// -------------------- S3 --------------------

func uploadJSON(bars []Place) error {
	data, err := json.Marshal(bars)
	if err != nil {
		return err
	}

	_, err = s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(cfg.Bucket),
		Key:    aws.String(cfg.Key),
		Body:   bytes.NewReader(data),
	})

	return err
}

func downloadJSON() ([]Place, error) {
	out, err := s3Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(cfg.Bucket),
		Key:    aws.String(cfg.Key),
	})
	if err != nil {
		return nil, err
	}
	defer out.Body.Close()

	data, err := io.ReadAll(out.Body)
	if err != nil {
		return nil, err
	}

	var bars []Place
	if err := json.Unmarshal(data, &bars); err != nil {
		return nil, err
	}

	return bars, nil
}

// -------------------- UI --------------------

var showConfirm bool
var lastState string = ""

func update(win *nucular.Window) {
	win.Row(20).Dynamic(1)

	abspath, err := filepath.Abs(cfg.FilesRoot)
	if err != nil {
		abspath = cfg.FilesRoot
	}
	win.Label("Folder: "+abspath, "LC")

	win.Row(30).Dynamic(2)

	if win.ButtonText("Upload files") {
		bars, err := loadYAMLFiles(cfg.FilesRoot)
		if err != nil {
			log.Println(err)
			lastState = "Load YAML ERROR: " + err.Error()
			return
		}
		if err := uploadJSON(bars); err != nil {
			lastState = "Upload ERROR: " + err.Error()
			log.Println(err)
		} else {
			log.Println("Upload OK!")
			lastState = fmt.Sprintf("Successfully uploaded %d places!", len(bars))
		}
	}

	if win.ButtonText("Reset files (download yamls)") {
		showConfirm = true
	}

	if showConfirm {
		win.Row(20).Dynamic(1)
		win.Label("This will override your local files. Are you sure?", "LC")

		win.Row(30).Dynamic(2)
		if win.ButtonText("Yes") {
			bars, err := downloadJSON()
			if err != nil {
				log.Println(err)
				showConfirm = false
				lastState = "Download ERROR: " + err.Error()
				return
			}
			if err := saveYAMLFiles(cfg.FilesRoot, bars); err != nil {
				log.Println(err)
				lastState = "Save YAML ERROR: " + err.Error()
			} else {
				lastState = fmt.Sprintf("Downloaded %d places from Rajmund cloud!", len(bars))
			}
			showConfirm = false
		}
		if win.ButtonText("No") {
			showConfirm = false
			lastState = ""
		}
	}

	if lastState != "" {
		win.Row(20).Dynamic(1)
		win.Label(lastState, "LC")
	}
}

// -------------------- MAIN --------------------
func resolveBasePath() string {
	exePath, err := os.Executable()
	if err != nil {
		log.Printf("ERROR: can't get executable path: %s", err)

		cwd, err := os.Getwd()
		if err != nil {
			log.Fatalf("Failed to get working directory: %v", err)
		}
		return cwd
	}

	exeDir := filepath.Dir(exePath)

	// Detect `go run` (temporary build directory)
	if strings.Contains(exeDir, os.TempDir()) {
		cwd, err := os.Getwd()
		if err != nil {
			log.Fatalf("Failed to get working directory: %v", err)
		}
		return cwd
	}

	return exeDir
}

func main() {
	basePath := resolveBasePath()
	loadAppConfig(basePath)
	fmt.Println("Malter Places. Directory: ", cfg.FilesRoot)

	w := nucular.NewMasterWindow(0, "Malter Places", update)
	w.SetStyle(style.FromTheme(style.DarkTheme, 1.0))
	w.Main()
}
