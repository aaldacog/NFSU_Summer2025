import React, { useState, useRef } from 'react';
import { View, Button, StyleSheet, Image, Alert, Text, ScrollView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Button 
          title="Request Camera Permission" 
          onPress={async () => {
            const result = await requestPermission();
            console.log("Permission result:", result);
          }} 
        />
      </View>
    );
  }

  const analyzeImage = async (imageUri) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      const backendUrl = 'http://172.234.207.58:8000/analyze-traffic-sign';
      const response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.error) {
          Alert.alert('Backend Error', result.error);
        } else {
          setAnalysisResult(result.description);
        }
      } else {
        const errorText = await response.text();
        Alert.alert('Error', `Backend error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to connect to backend: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1.0,
          base64: false,
          exif: false,
          imageType: 'jpg',
        });
        
        if (photo.uri && photo.width > 0 && photo.height > 0) {
          setPhotoUri(photo.uri);
          setAnalysisResult(null);
        } else {
          Alert.alert('Error', 'Image appears to be empty or invalid');
        }
      } else {
        Alert.alert('Error', 'Camera not ready');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture: ' + error.message);
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setAnalysisResult(null);
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <ScrollView contentContainerStyle={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          
          <View style={styles.buttonRow}>
            <Button title="Retake" onPress={retakePhoto} />
            <Button 
              title="Analyze Sign" 
              onPress={() => analyzeImage(photoUri)}
              disabled={isAnalyzing}
            />
          </View>

          {isAnalyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.loadingText}>Analyzing image...</Text>
            </View>
          )}

          {analysisResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Traffic Sign Analysis:</Text>
              <Text style={styles.resultText}>{analysisResult}</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing="back"
            ref={cameraRef}
            onCameraReady={() => console.log('Camera is ready OKK!')}
            onMountError={(error) => console.log('Camera mount error:', error)}
          />
          <View style={styles.buttonContainer}>
            <Button title="Take Picture" onPress={takePicture} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black' 
  },
  preview: {   
    width: 300,
    height: 400,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: { 
    flex: 1 
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
    padding: 10,
  },
  previewContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingVertical: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 20,
  },
  loadingContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  resultContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    marginBottom: 30,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
});
