package com.mezbaan.pos;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BluetoothSppPlugin",
    permissions = {
        @Permission(alias = "bluetooth", strings = {
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN
        }),
        @Permission(alias = "bluetooth_scan", strings = {
            Manifest.permission.BLUETOOTH_SCAN
        }),
        @Permission(alias = "bluetooth_connect", strings = {
            Manifest.permission.BLUETOOTH_CONNECT
        })
    }
)
public class BluetoothSppPlugin extends Plugin {

    private static final String TAG = "BluetoothSppPlugin";
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket bluetoothSocket;
    private OutputStream outputStream;

    @Override
    public void load() {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            BluetoothManager manager = (BluetoothManager) context.getSystemService(Context.BLUETOOTH_SERVICE);
            if (manager != null) {
                bluetoothAdapter = manager.getAdapter();
            }
        } else {
            bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        List<String> denied = new ArrayList<>();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("bluetooth_scan") != PermissionState.GRANTED) {
                denied.add("BLUETOOTH_SCAN");
            }
            if (getPermissionState("bluetooth_connect") != PermissionState.GRANTED) {
                denied.add("BLUETOOTH_CONNECT");
            }
        } else {
            if (getPermissionState("bluetooth") != PermissionState.GRANTED) {
                denied.add("BLUETOOTH");
            }
        }

        result.put("granted", denied.isEmpty());
        try {
            result.put("denied", new JSArray(denied));
        } catch (JSONException e) {
            result.put("denied", new JSArray());
        }
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestPermissionForAliases(new String[]{"bluetooth_scan", "bluetooth_connect"}, call, "permissionsCallback");
        } else {
            requestPermissionForAliases(new String[]{"bluetooth"}, call, "permissionsCallback");
        }
    }

    @PermissionCallback
    public void permissionsCallback(PluginCall call) {
        checkPermissions(call);
    }

    @PluginMethod
    public void isBluetoothEnabled(PluginCall call) {
        JSObject result = new JSObject();
        boolean enabled = bluetoothAdapter != null && bluetoothAdapter.isEnabled();
        result.put("enabled", enabled);
        call.resolve(result);
    }

    @PluginMethod
    public void enableBluetooth(PluginCall call) {
        JSObject result = new JSObject();
        if (bluetoothAdapter == null) {
            result.put("enabled", false);
            call.resolve(result);
            return;
        }
        if (bluetoothAdapter.isEnabled()) {
            result.put("enabled", true);
            call.resolve(result);
            return;
        }
        // Cannot silently enable on modern Android; prompt user via system intent
        Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
        enableBtIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(enableBtIntent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to request Bluetooth enable", e);
        }
        result.put("enabled", false);
        call.resolve(result);
    }

    @PluginMethod
    @SuppressLint("MissingPermission")
    public void getPairedDevices(PluginCall call) {
        JSObject result = new JSObject();
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            result.put("devices", new JSArray());
            call.resolve(result);
            return;
        }

        Set<BluetoothDevice> bonded = bluetoothAdapter.getBondedDevices();
        JSArray devicesArray = new JSArray();
        if (bonded != null) {
            for (BluetoothDevice device : bonded) {
                JSObject d = new JSObject();
                d.put("address", device.getAddress());
                String name = device.getName();
                d.put("name", name != null ? name : "Unknown Device");
                devicesArray.put(d);
            }
        }
        result.put("devices", devicesArray);
        call.resolve(result);
    }

    @PluginMethod
    @SuppressLint("MissingPermission")
    public void startDiscovery(PluginCall call) {
        JSObject result = new JSObject();
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            result.put("started", false);
            call.resolve(result);
            return;
        }
        if (bluetoothAdapter.isDiscovering()) {
            bluetoothAdapter.cancelDiscovery();
        }
        boolean started = bluetoothAdapter.startDiscovery();
        result.put("started", started);
        call.resolve(result);
    }

    @PluginMethod
    @SuppressLint("MissingPermission")
    public void cancelDiscovery(PluginCall call) {
        JSObject result = new JSObject();
        if (bluetoothAdapter != null && bluetoothAdapter.isDiscovering()) {
            bluetoothAdapter.cancelDiscovery();
            result.put("cancelled", true);
        } else {
            result.put("cancelled", false);
        }
        call.resolve(result);
    }

    @PluginMethod
    @SuppressLint("MissingPermission")
    public void connect(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("Device address is required");
            return;
        }
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            call.reject("Bluetooth is not enabled");
            return;
        }

        // Disconnect any existing connection
        closeConnection();

        try {
            BluetoothDevice device = bluetoothAdapter.getRemoteDevice(address);
            if (device == null) {
                call.reject("Device not found: " + address);
                return;
            }

            if (bluetoothAdapter.isDiscovering()) {
                bluetoothAdapter.cancelDiscovery();
            }

            bluetoothSocket = device.createRfcommSocketToServiceRecord(SPP_UUID);
            bluetoothSocket.connect();
            outputStream = bluetoothSocket.getOutputStream();

            JSObject result = new JSObject();
            result.put("connected", true);
            result.put("message", "Connected to " + device.getName());
            call.resolve(result);
        } catch (IOException e) {
            Log.e(TAG, "Connection failed", e);
            closeConnection();
            call.reject("Failed to connect: " + e.getMessage());
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        closeConnection();
        JSObject result = new JSObject();
        result.put("disconnected", true);
        call.resolve(result);
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        JSObject result = new JSObject();
        boolean connected = bluetoothSocket != null && bluetoothSocket.isConnected() && outputStream != null;
        result.put("connected", connected);
        call.resolve(result);
    }

    @PluginMethod
    @SuppressLint("MissingPermission")
    public void printData(PluginCall call) {
        JSArray data = call.getArray("data");
        if (data == null) {
            call.reject("Print data is required");
            return;
        }
        if (outputStream == null || bluetoothSocket == null || !bluetoothSocket.isConnected()) {
            call.reject("No printer connected");
            return;
        }

        try {
            byte[] bytes = new byte[data.length()];
            for (int i = 0; i < data.length(); i++) {
                bytes[i] = (byte) data.getInt(i);
            }
            outputStream.write(bytes);
            outputStream.flush();

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Printed " + bytes.length + " bytes");
            call.resolve(result);
        } catch (JSONException e) {
            call.reject("Invalid data format: " + e.getMessage());
        } catch (IOException e) {
            Log.e(TAG, "Print failed", e);
            closeConnection();
            call.reject("Print failed: " + e.getMessage());
        }
    }

    private void closeConnection() {
        if (outputStream != null) {
            try {
                outputStream.close();
            } catch (IOException ignored) {}
            outputStream = null;
        }
        if (bluetoothSocket != null) {
            try {
                bluetoothSocket.close();
            } catch (IOException ignored) {}
            bluetoothSocket = null;
        }
    }
}
