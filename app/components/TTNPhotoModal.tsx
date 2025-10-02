// app/components/TTNPhotoModal.tsx
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';

interface TTNPhotoModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (photoUri: string) => void;
}

const TTNPhotoModal: React.FC<TTNPhotoModalProps> = ({ visible, onClose, onPhotoTaken }) => {
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { getThemeColor } = useUser();
  const themeColor = getThemeColor();

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setPhoto(photo.uri);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const retakePicture = () => {
    setPhoto(null);
  };

  const usePicture = () => {
    if (photo) {
      onPhotoTaken(photo);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <Text style={styles.message}>Нужен доступ к камере для съемки ТТН</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: themeColor }]} onPress={requestPermission}>
            <Text style={styles.buttonText}>Предоставить доступ</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {!photo ? (
          <>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color={themeColor} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Сфотографируйте ТТН</Text>
              <View style={styles.placeholder} />
            </View>
            
            <CameraView 
              style={styles.camera} 
              facing={facing}
              ref={cameraRef}
            >
              <View style={styles.cameraOverlay}>
                <Text style={styles.overlayText}>
                  Расположите ТТН в рамке для лучшего распознавания
                </Text>
                <View style={styles.documentFrame} />
              </View>
              
              <View style={styles.cameraControls}>
                <TouchableOpacity 
                  style={styles.flipButton}
                  onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
                >
                  <Ionicons name="camera-reverse-outline" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <View style={[styles.captureButtonInner, { borderColor: '#FFFFFF' }]} />
                </TouchableOpacity>
                
                <View style={styles.placeholderButton} />
              </View>
            </CameraView>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={retakePicture}>
                <Ionicons name="arrow-back" size={24} color={themeColor} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Предпросмотр фото</Text>
              <View style={styles.placeholder} />
            </View>
            
            <Image source={{ uri: photo }} style={styles.preview} />
            
            <View style={styles.photoControls}>
              <TouchableOpacity 
                style={[styles.photoButton, { backgroundColor: '#F5F5F5' }]}
                onPress={retakePicture}
              >
                <Ionicons name="camera-outline" size={20} color="#424242" />
                <Text style={[styles.photoButtonText, { color: '#424242' }]}>Переснять</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.photoButton, { backgroundColor: themeColor }]}
                onPress={usePicture}
              >
                <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                <Text style={[styles.photoButtonText, { color: '#FFFFFF' }]}>Использовать фото</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 4,
  },
  documentFrame: {
    width: 300,
    height: 200,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  flipButton: {
    padding: 12,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  placeholderButton: {
    width: 40,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  photoControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#000',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default TTNPhotoModal;