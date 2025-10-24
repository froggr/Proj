// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Emitter};

#[tauri::command]
fn get_available_monitors(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let monitors = app.available_monitors()
        .map_err(|e| e.to_string())?;

    let monitor_names: Vec<String> = monitors.iter()
        .enumerate()
        .map(|(i, m)| {
            format!("Monitor {} - {}x{}",
                i + 1,
                m.size().width,
                m.size().height
            )
        })
        .collect();

    Ok(monitor_names)
}

#[tauri::command]
fn open_projector_window(app: tauri::AppHandle, monitor_index: Option<usize>) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder, PhysicalPosition, PhysicalSize, Position, Size};

    println!("Opening projector window on monitor index: {:?}", monitor_index);

    let monitors = app.available_monitors()
        .map_err(|e| e.to_string())?;

    println!("Available monitors: {}", monitors.len());
    for (i, m) in monitors.iter().enumerate() {
        println!("  Monitor {}: {}x{} at ({}, {})",
            i, m.size().width, m.size().height, m.position().x, m.position().y);
    }

    // Build the window first without positioning
    let builder = WebviewWindowBuilder::new(
        &app,
        "projector",
        WebviewUrl::App("/projector".into())
    )
    .title("Church Presenter - Projector")
    .decorations(false)
    .skip_taskbar(true)
    .fullscreen(false)
    .visible(false); // Start hidden so we can position before showing

    let projector = builder.build()
        .map_err(|e| e.to_string())?;

    // Now position and resize the window if a monitor is specified
    if let Some(index) = monitor_index {
        if let Some(mon) = monitors.get(index) {
            let pos = mon.position();
            let size = mon.size();

            println!("Moving window to ({}, {}) with size {}x{}",
                pos.x, pos.y, size.width, size.height);

            // Set position and size using the window methods
            projector.set_position(Position::Physical(PhysicalPosition {
                x: pos.x,
                y: pos.y,
            })).map_err(|e| e.to_string())?;

            projector.set_size(Size::Physical(PhysicalSize {
                width: size.width,
                height: size.height,
            })).map_err(|e| e.to_string())?;

            println!("Window positioned successfully");

            // Give window manager time to process position change
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
    }

    // Now show the window
    projector.show().map_err(|e| e.to_string())?;

    println!("Projector window opened successfully");

    Ok(())
}

#[tauri::command]
fn close_projector_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("projector") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn update_projector(app: tauri::AppHandle, slide_data: String) -> Result<(), String> {
    println!("Backend: update_projector called with data: {}", &slide_data[..slide_data.len().min(100)]);

    if let Some(window) = app.get_webview_window("projector") {
        println!("Backend: Found projector window, emitting event");
        // Parse the JSON and re-emit it to the projector window
        window.emit("update-slide", slide_data.clone()).map_err(|e| {
            println!("Backend: Failed to emit event: {}", e);
            e.to_string()
        })?;
        println!("Backend: Event emitted successfully");
    } else {
        println!("Backend: WARNING - Projector window not found!");
    }
    Ok(())
}

#[tauri::command]
async fn fetch_canva_content(url: String) -> Result<String, String> {
    use tauri_plugin_http::reqwest;

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&url)
        .header("Referer", "https://www.canva.com/")
        .header("Origin", "https://www.canva.com")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html_text = response.text().await.map_err(|e| e.to_string())?;

    // Return HTML content directly
    Ok(html_text)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            get_available_monitors,
            open_projector_window,
            close_projector_window,
            update_projector,
            fetch_canva_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
