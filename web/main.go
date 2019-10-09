package main

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/pkg/errors"
	"golang.org/x/oauth2/google"
	ml "google.golang.org/api/ml/v1"
	"google.golang.org/api/option"
)

var tmpl *template.Template

func init() {
	tmpl = template.Must(template.ParseFiles("tmpl/index.html"))
}

func main() {
	http.HandleFunc("/", indexHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Printf("Defaulting to %s\n", port)
	}

	log.Printf("Listening on %s\n", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%s", port), nil))
}

func indexHandler(res http.ResponseWriter, req *http.Request) {
	if req.URL.Path != "/" {
		notFoundHandler(res, req)
		return
	}

	tmpl.Lookup("index.html").Execute(res, nil)
}

func swHandler(res http.ResponseWriter, req *http.Request) {
	http.ServeFile(res, req, "static/sw.js")
}

var robotstxtText = `User-agent: *
Allow: /`

func robotstxtHandler(res http.ResponseWriter, req *http.Request) {
	res.Header().Set("Content-Type", "text/plain; charset=utf-8")
	res.Header().Set("X-Content-Type-Options", "nosniff")
	fmt.Fprint(res, robotstxtText)
}

func predictionHandler(res http.ResponseWriter, req *http.Request, projectid, modelName, modelVersion string) {
	if req.Method != http.MethodPost {
		notFoundHandler(res, req)
		return
	}

	data, err := ioutil.ReadAll(req.Body)
	if err != nil {
		log.Printf("Error while reading body: %v", err)
		http.Error(res, "Internal Error", http.StatusInternalServerError)
		return
	}

	ctx := req.Context()

	pred, err := predict(ctx, data, projectid, modelName, modelVersion)
	if err != nil {
		log.Printf("Error from predict: %v", err)
		http.Error(res, "Internal Error", http.StatusInternalServerError)
		return
	}

	output := pred.Predictions[0].Base64String
	output = output[1 : len(output)-1]
	output = append([]byte("data:image/jpeg;base64,"), output...)

	res.Header().Set("Content-Type", "text/plain; charset=utf-8")
	res.Header().Set("X-Content-Type-Options", "nosniff")
	res.Write(output)
}

func notFoundHandler(res http.ResponseWriter, req *http.Request) {
	res.WriteHeader(404)
	fmt.Fprint(res, "Not Found")
}

func predict(ctx context.Context, data []byte, projectid, modelName, modelVersion string) (*PredictResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	client, err := google.DefaultClient(ctx, ml.CloudPlatformScope)
	if err != nil {
		return nil, errors.Wrap(err, "Cannot Create Client")
	}

	service, err := ml.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, errors.Wrap(err, "Cannot Create Service")
	}

	projectsService := ml.NewProjectsService(service)

	req := &ml.GoogleCloudMlV1__PredictRequest{
		HttpBody: &ml.GoogleApi__HttpBody{
			Data: string(data),
		},
	}

	req.HttpBody.ContentType = "application/json"

	call := projectsService.Predict("projects/"+projectid+"/models/"+modelName+"/versions/"+modelVersion, req)

	body, err := call.Do()
	if err != nil {
		return nil, errors.Wrap(err, "predictor.Predict")
	}

	res := &PredictResponse{}
	if err := json.Unmarshal([]byte(body.Data), &res); err != nil {
		return nil, errors.Wrap(err, "predictor.Predict")
	}

	if len(res.Predictions) == 0 {
		return nil, errors.Wrap(err, body.Data)
	}

	return res, nil
}

// PredictResponse is raw unmarshalled CMLE response
type PredictResponse struct {
	Predictions []*Prediction `json:"predictions"`
}

// Prediction is a single prediction from CMLE
type Prediction struct {
	Base64String json.RawMessage `json:"b64"`
}
