Feature: Portal del empleado - Colillas de pago

  Scenario: Consulta exitosa de colillas de pago
    Given que abro el portal del empleado
    When hago clic en el enlace de Coillas de pago
    And ingreso el número de documento "1038867501"
    And acepto el tratamiento de datos
    And marco la casilla No soy un robot
    And selecciono el periodo de pago "16/12/2024 - 24/12/2024"
    Then debería ver el mensaje de éxito

  Scenario: Error por documento vacío
    Given que abro el portal del empleado
    When hago clic en el enlace de Coillas de pago
    And ingreso el número de documento ""
    Then debería ver el mensaje de error "requerido"

  Scenario: Cancelar después de ingresar documento
    Given que abro el portal del empleado
    When hago clic en el enlace de Coillas de pago
    And ingreso el número de documento "1038867501"
    And hago clic en el botón "Cancelar"
    Then debería volver a la página principal

  Scenario: Intentar confirmar sin aceptar tratamiento (validación)
    Given que abro el portal del empleado
    When hago clic en el enlace de Coillas de pago
    And ingreso el número de documento "1038867501"
    And hago clic en el botón "Confirmar"
    Then debería ver el mensaje de error "requerido"

  Scenario: Aceptar tratamiento y cerrar modal informativo
    Given que abro el portal del empleado
    When hago clic en el enlace de Coillas de pago
    And ingreso el número de documento "1038867501"
    And acepto el tratamiento de datos
    And hago clic en el botón "OK"
    Then debería ver el mensaje de éxito

  Scenario: Flujo alterno: rechazar tratamiento
    Given que abro el portal del empleado
    When hago clic en el enlace de Coillas de pago
    And ingreso el número de documento "1038867501"
    And hago clic en el botón "Cancelar"
    Then debería volver a la página principal