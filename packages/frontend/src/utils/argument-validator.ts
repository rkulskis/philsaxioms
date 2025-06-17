import { Argument, ActivationConditions } from '@philsaxioms/shared';

export interface ValidationContext {
  acceptedAxioms: Set<string>;
  validArguments: Set<string>;
  allArguments: Argument[];
}

export class ArgumentValidator {
  /**
   * Check if an argument can be activated based on its conditions
   */
  canActivateArgument(
    argument: Argument, 
    context: ValidationContext, 
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(argument.id)) return false; // Prevent circular dependencies
    if (!argument.activation_conditions) return false; // No activation conditions means can't activate
    
    visited.add(argument.id);
    
    const conditions = argument.activation_conditions;
    
    // Check required axioms
    if (!this.checkRequiredAxioms(conditions, context)) {
      return false;
    }
    
    // Check forbidden axioms
    if (!this.checkForbiddenAxioms(conditions, context)) {
      return false;
    }
    
    // Check required arguments (recursive)
    if (!this.checkRequiredArguments(conditions, context, new Set(visited))) {
      return false;
    }
    
    // Check forbidden arguments
    if (!this.checkForbiddenArguments(conditions, context)) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate all valid arguments based on accepted axioms
   */
  calculateValidArguments(
    argumentList: Argument[], 
    acceptedAxioms: Set<string>
  ): Set<string> {
    const valid = new Set<string>();
    const context: ValidationContext = {
      acceptedAxioms,
      validArguments: valid,
      allArguments: argumentList,
    };

    // Iteratively add arguments whose activation conditions are met
    let changed = true;
    while (changed) {
      changed = false;
      
      for (const argument of argumentList) {
        if (valid.has(argument.id)) continue;
        
        if (this.canActivateArgument(argument, context)) {
          valid.add(argument.id);
          changed = true;
        }
      }
    }
    
    return valid;
  }

  private checkRequiredAxioms(conditions: ActivationConditions, context: ValidationContext): boolean {
    if (conditions.required_axioms) {
      for (const axId of conditions.required_axioms) {
        if (!context.acceptedAxioms.has(axId)) return false;
      }
    }
    return true;
  }

  private checkForbiddenAxioms(conditions: ActivationConditions, context: ValidationContext): boolean {
    if (conditions.forbidden_axioms) {
      for (const axId of conditions.forbidden_axioms) {
        if (context.acceptedAxioms.has(axId)) return false;
      }
    }
    return true;
  }

  private checkRequiredArguments(
    conditions: ActivationConditions, 
    context: ValidationContext, 
    visited: Set<string>
  ): boolean {
    if (conditions.required_arguments) {
      for (const reqArgId of conditions.required_arguments) {
        if (!context.validArguments.has(reqArgId)) {
          const reqArg = context.allArguments.find(a => a.id === reqArgId);
          if (!reqArg || !this.canActivateArgument(reqArg, context, visited)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private checkForbiddenArguments(conditions: ActivationConditions, context: ValidationContext): boolean {
    if (conditions.forbidden_arguments) {
      for (const forbiddenArgId of conditions.forbidden_arguments) {
        if (context.validArguments.has(forbiddenArgId)) return false;
      }
    }
    return true;
  }
}